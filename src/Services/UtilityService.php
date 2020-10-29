<?php

namespace App\Services;

use App\Lms\Canvas\CanvasLms;
use App\Lms\D2l\D2lLms;
use App\Entity\Course;
use App\Entity\Institution;
use App\Entity\LogEntry;
use App\Entity\User;
use App\Lms\LmsInterface;
use DateTime;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Session\SessionInterface;
use Symfony\Component\Security\Core\Security;
use Twig\Environment;

class UtilityService {

    const ENV_DEV = 'dev';
    const ENV_PROD = 'prod';
    const CANVAS_LMS = 'canvas';
    const D2L_LMS = 'd2l';

    public static $timezone;

    /** @var SessionInterface $session */
    private $session;

    /** @var Environment $twig */
    private $twig;
    
    /** @var ManagerRegistry */
    private $doctrine;

    /** @var Security $security */
    private $security;

    /** @var ParameterBagInterface */
    private $paramBag;
    
    private $env;

    private $messages = [];

    public function __construct(
        SessionInterface $session,
        ManagerRegistry $doctrine,
        Environment $twig,
        Security $security,
        ParameterBagInterface $paramBag)
    {
        $this->session = $session;
        $this->twig = $twig;
        $this->doctrine = $doctrine;
        $this->security = $security;
        $this->paramBag = $paramBag;

        self::$timezone = new \DateTimeZone('GMT');
    }

    public function getEnv()
    {
        if (!isset($this->env)) {
            $this->env = $this->session->get('app_env');
        }
        if (!isset($this->env)) {
            $this->env = $_ENV['APP_ENV'];
            $this->session->set('app_env', $_ENV['APP_ENV']);
        }

        return $this->env;
    }

    public function getInstitutionById($id)
    {
        return $this->doctrine->getRepository(Institution::class)->find($id);
    }

    public function getCourseById($id)
    {
        return $this->doctrine->getRepository(Course::class)->find($id);
    }

    public function createCourse(Institution $institution, $lmsCourseId)
    {
        $course = new Course();
        $course->setInstitution($institution);
        $course->setLmsCourseId($lmsCourseId);
        $course->setTitle("New Course: ID#{$lmsCourseId}");
        $course->setActive(true);
        $course->setDirty(false);

        $this->doctrine->getManager()->persist($course);
        $this->doctrine->getManager()->flush();

        return $course;
    }

    public function getUnreadMessages($markAsRead = true)
    {
        $user = $this->security->getUser();
        
        $messages = $this->doctrine->getRepository(LogEntry::class)->findBy(['user' => $user, 'status' => false]);

        if ($markAsRead) {
            foreach ($messages as $msg) {
                $msg->setStatus(true);
            }

            $this->doctrine->getManager()->flush();
        }

        return $messages;
    }

    public function createMessage($msg, $severity = 'notice', Course $course = null, User $user = null, $hideFromUser = false)
    {
        if (!$user) {
            $user = $this->security->getUser();
        }

        if (is_array($msg) || is_object($msg)) {
            $msg = \json_encode($msg);
        }
        
        $message = new LogEntry();
        $message->setMessage($msg);
        $message->setSeverity($severity);
        $message->setUser($user);
        $message->setStatus($hideFromUser);
        $message->setCreated($this->getCurrentTime());
        
        if ($course) {
            $message->setCourse($course);
        }

        $this->doctrine->getManager()->persist($message);
        $this->doctrine->getManager()->flush();
    }

    public function exitWithMessage($msg, $severity = 'error', Course $course = null) 
    {        
        $this->createMessage($msg, $severity, $course);

        print $this->twig->render('error.html.twig', [
            'page_title' => 'Application Error',
            'messages' => $this->getUnreadMessages(true),
        ]);

        exit;
    }

    public function encryptData($data)
    {
        $nonce = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
        $encrypted_data = sodium_crypto_secretbox($data, $nonce, $this->encryption_key);

        return base64_encode($nonce . $encrypted_data);
    }

    public function decryptData($data)
    {
        $encrypted_data = base64_decode($data);

        //  Decrypt the token.
        $nonce = mb_substr($encrypted_data, 0, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES, '8bit');
        $encrypted_text = mb_substr($encrypted_data, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES, NULL, '8bit');

        return sodium_crypto_secretbox_open($encrypted_text, $nonce, $this->encryption_key);
    }

    public function getCurrentTime() 
    {
        return new \DateTime('now', self::$timezone);
    }

    public function getTempPath()
    {
        $tmpPath = $this->paramBag->get('kernel.project_dir') . '/tmp';

        if (!file_exists($tmpPath)) {
            mkdir($tmpPath);
        }

        return $tmpPath;
    }

    public function getTranslation($lang = 'en')
    {
        $translation = [];

        try {
            $filepath = "../translations/" . $lang . ".json";
            if (file_exists($filepath)) {
                $file = fopen($filepath, "r");
                $json = fread($file, filesize($filepath));
                
                 $translation = \json_decode($json);
            } else {
                throw new \Exception("Translation for language `{$lang}` cannot be found.");
            }
        } 
        catch (\Exception $e) {
            $this->createMessage($e->getMessage(), 'error');
        }

        return $translation;
    }
}