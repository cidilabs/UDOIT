<?php

namespace App\Controller;

use App\Entity\Course;
use App\Entity\Institution;
use App\Entity\User;
use App\Entity\ContentItem;
use App\Repository\CourseRepository;
use App\Response\ApiResponse;
use App\Services\LmsApiService;
use App\Services\LmsFetchService;
use App\Services\PhpAllyService;
use App\Message\BackgroundQueueItem;
use App\Message\PriorityQueueItem;
use App\Repository\UserRepository;
use App\Services\UtilityService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Routing\Annotation\Route;

class SyncController extends ApiController
{
    protected $maxAge = '1D';

    /** @var UtilityService $util */
    protected $util;

    /**
     * @Route("/api/sync/{course}", name="request_sync", methods={"GET"})
     */
    public function requestSync(Course $course, LmsFetchService $lmsFetch)
    {
        $response = new ApiResponse();
        $user = $this->getUser();
        $reportArr = false;

        try {
            if (!$this->userHasCourseAccess($course)) {
                throw new \Exception('msg.no_permissions');
            }
            if ($course->isDirty()) {
                throw new \Exception('msg.course_scanning');
            }
            if (!$course->isActive()) {
                $response->setData(0);
                throw new \Exception('msg.sync.course_inactive');
            }

            $lmsFetch->refreshLmsContent($course, $user);
            
            $report = $course->getLatestReport();

            if (!$report) {
                throw new \Exception('msg.no_report_created');
            }

            $reportArr = $report->toArray();
            $reportArr['files'] = $course->getFileItems();
            $reportArr['issues'] = $course->getAllIssues();
            $reportArr['contentItems'] = $course->getContentItems();

            $response->setData($reportArr);

            $prevReport = $course->getPreviousReport();
            if ($prevReport && ($prevReport->getIssueCount() == $report->getIssueCount())) {
                $response->addMessage('msg.no_new_content', 'success', 5000);
            } else {
                $response->addMessage('msg.new_content', 'success', 5000);
            }
        } catch (\Exception $e) {
            if ('msg.course_scanning' === $e->getMessage()) {
                $response->addMessage($e->getMessage(), 'info', 0, false);
            } else {
                $response->addMessage($e->getMessage(), 'error', 0);
            }
        }

        return new JsonResponse($response);
    }

    /**
     * 
     * @Route("/api/sync/content/{contentItem}", name="content_sync", methods={"GET"})
     */
    public function requestContentSync(ContentItem $contentItem, LmsFetchService $lmsFetch, PhpAllyService $phpAlly)
    {
        $response = new ApiResponse();
        $course = $contentItem->getCourse();
        $user = $this->getUser();

        // Delete old issues
        $lmsFetch->deleteContentItemIssues(array($contentItem));

        // Rescan the contentItem
        $phpAllyReport = $phpAlly->scanContentItem($contentItem);

        // Add rescanned Issues to database
        foreach ($phpAllyReport->getIssues() as $issue) {
            // Create issue entity 
            $lmsFetch->createIssue($issue, $contentItem);
        }

        // Update report
        $report = $lmsFetch->updateReport($course, $user);
        if (!$report) {
            throw new \Exception('msg.no_report_created');
        }

        $reportArr = $report->toArray();
        $reportArr['files'] = $course->getFileItems();
        $reportArr['issues'] = $course->getAllIssues();
        $reportArr['contentItems'] = $course->getContentItems();
        $response->setData($reportArr);

        return new JsonResponse($response);
    }

    /**
     * {
     *   user: {
     *     lmsUserId: 123,
     *     domainName: 'cidilabs.instructure.com',
     *     refreshToken: '12345ABCDE',
     *   },
     *   courseIds: [12, 23, 34, 45]
     * }
     * 
     * @Route("/api/sync/batch", name="batch_sync", methods={"POST"})
     */
    public function batchSync(
        Request $request,
        MessageBusInterface $messageBus, 
        UserRepository $userRepo,
        CourseRepository $courseRepo)
    {
        // get user data
        $data = \json_decode($request->getContent(), true);

        // check if user exists
        if (!empty($data['user'])) {
            $userData = $data['user'];
            $username = "{$userData['domainName']}||{$userData['lmsUserId']}";
            $syncUser = $userRepo->findOneBy(['username' => $username]);
        }
        else {
            return $this->json(false);
        }

        // create user if doesn't exist
        if (empty($syncUser)) {
            $syncUser = $this->createUser($userData);
        }
        if (!$syncUser) {
            return $this->json(false);
        }

        // get list of lmsCourseIds
        $lmsCourseIds = isset($data['lmsCourseIds']) ? $data['lmsCourseIds'] : null;
        if (!$lmsCourseIds) {
            return $this->json(false);
        }

        $institution = $syncUser->getInstitution();

        foreach ($lmsCourseIds as $lmsCourseId) {
            $course = $courseRepo->findOneBy(['institution' => $institution, 'lmsCourseId' => $lmsCourseId]);

            if (!$course) {
                $course = $this->createCourse($institution, $lmsCourseId);
            }

            $messageBus->dispatch(new BackgroundQueueItem($course, $syncUser, 'refreshContent'));
        }

        $this->getDoctrine()->getManager()->flush();

        return $this->json(true);
    }

    protected function createUser($userData)
    {
        $institution = $this->getInstitutionByDomain($userData['domainName']);
        if (!$institution) {
            return false;
        }

        $user = new User();
        $user->setInstitution($institution);
        $user->setUsername("{$userData['domainName']}||{$userData['lmsUserId']}");
        $user->setLmsUserId($userData['lmsUserId']);
        $user->setName('Batch Sync User');
        $user->setApiKey('temporary');
        $user->setRefreshToken($userData['refreshToken']);
        $user->setCreated(new \DateTime());
        $user->setLastLogin(new \DateTime());

        $this->getDoctrine()->getManager()->persist($user);
        $this->getDoctrine()->getManager()->flush();

        return $user;
    }

    protected function createCourse(Institution $institution, $lmsCourseId)
    {
        $course = new Course();
        $course->setInstitution($institution);
        $course->setLmsCourseId($lmsCourseId);
        $course->setTitle("New Course: ID#{$lmsCourseId}");
        $course->setActive(true);
        $course->setDirty(false);

        $this->getDoctrine()->getManager()->persist($course);
        $this->getDoctrine()->getManager()->flush();

        return $course;
    }

    protected function getInstitutionByDomain($domain)
    {
        $institutionRepo = $this->getDoctrine()->getRepository(Institution::class);
        $institution = $institutionRepo->findOneBy(['lmsDomain' => $domain]);
        if (empty($institution)) {
            $institution = $institutionRepo->findOneBy(['vanityUrl' => $domain]);
        }

        return $institution;
    }
}
