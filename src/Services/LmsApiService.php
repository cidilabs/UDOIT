<?php

namespace App\Services;

use App\Entity\User;
use App\Lms\Canvas\CanvasLms;
use App\Lms\D2l\D2lLms;
use Doctrine\Persistence\ManagerRegistry;

class LmsApiService {
    const CANVAS_LMS = 'canvas';
    const D2L_LMS = 'd2l';

    /** @var SessionService $sessionService */
    protected $sessionService;

    /** @var CanvasLms $canvasLms */
    private $canvasLms;

    /** @var D2lLms $d2lLms */
    private $d2lLms;


    public function __construct(
        SessionService $sessionService,
        ManagerRegistry $doctrine,
        CanvasLms $canvasLms,
        D2lLms $d2lLms)
    {
        $this->sessionService = $sessionService;
        $this->doctrine = $doctrine;  

        $this->canvasLms = $canvasLms;
        $this->d2lLms = $d2lLms;
    }

    public function getLmsId(?User $user = null)
    {
        $session = $this->sessionService->getSession();

        if ($user) {
            return $user->getInstitution()->getLmsId();
        }
        if ($lmsId = $session->get('lms_id')) {
            return $lmsId;
        }
        
        return $_ENV['APP_LMS'];
    }

    public function getLms(?User $user = null)
    {
        $lmsId = $this->getLmsId($user);

        if (self::CANVAS_LMS === $lmsId) {
            return $this->canvasLms;
        } elseif (self::D2L_LMS === $lmsId) {
            return $this->d2lLms;
        } else {
            // handle other LMS classes
        }

        return false;
    }
}
