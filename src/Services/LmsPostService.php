<?php

namespace App\Services;

use App\Entity\ContentItem;
use App\Entity\FileItem;
use App\Entity\Issue;
use App\Entity\User;
use App\Services\LmsApiService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\File\UploadedFile;


class LmsPostService {

    /** @var App\Services\LmsApiService $lmsApi */
    protected $lmsApi;

    protected $lmsUser;

    /** @var App\Services\UtilityService $util */
    protected $util;

    protected $entityManager;

    /** @var App\Services\HtmlService $html */
    protected $html;

    public function __construct(
        LmsApiService $lmsApi, 
        LmsUserService $lmsUser,
        UtilityService $util, 
        EntityManagerInterface $entityManager,
        HtmlService $html)
    {
        $this->lmsApi = $lmsApi;  
        $this->lmsUser = $lmsUser;      
        $this->util = $util;
        $this->entityManager = $entityManager;
        $this->html = $html;
    }

    public function saveContentToLms(Issue $issue, User $user)
    {
        $contentItem = $issue->getContentItem();
        $lms = $this->lmsApi->getLms();

        $this->lmsUser->validateApiKey($user);

        $lms->updateContentItem($contentItem);

        $replaceSuccess = $this->replaceContent($issue, $contentItem);
        if (!$replaceSuccess) {
            $this->util->createMessage(
                'Fixed HTML was not replaced in LMS. Please contact an administrator.',
                'error',
                $contentItem->getCourse()
            );
            return;
        }

        return $lms->postContentItem($contentItem);
    }

    public function saveFileToLms(FileItem $file, UploadedFile $uploadedFile, User $user)
    {
        $lms = $this->lmsApi->getLms();
        $path = $this->util->getTempPath();

        $this->lmsUser->validateApiKey($user);
        
        try {
            $uploadedFile->move($path, "file.{$file->getId()}");
        }
        catch (\Exception $e) {
            $this->util->createMessage(
                'File failed to save locally. Please contact an administrator.',
                'error',
                $file->getCourse()
            );
            return;
        }

        return $lms->postFileItem($file);
    }

    public function replaceContent(Issue $issue, ContentItem $contentItem)
    {
        $error = $issue->getHtml();
        $corrected = $issue->getNewHtml();
        $body = $contentItem->getBody();
        
        // If issue HTML is not found in body HTML: 
        // 1. Try tidying the error through the DOM
        if (strpos($body, $error) === false) {
            $error = $this->html->clean($error);
        }

        $cnt = 0;
        $replaced = str_replace($error, $corrected, $body, $cnt);

        if (!$cnt) {
            $exceptions = [
                '" />' => '"/>',
                'src= "' => 'src="',
            ];

            foreach ($exceptions as $search => $replace) {
                $error = str_replace($search, $replace, $error);

                $replaced = str_replace($error, $corrected, $body, $cnt);
                if ($cnt) {
                    break;
                }
            }
        }

        if ($cnt) {
            $contentItem->setBody($replaced);
            $this->entityManager->flush();
        }

        return $cnt;
    }
}
