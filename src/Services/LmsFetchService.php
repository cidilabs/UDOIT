<?php

namespace App\Services;

use App\Entity\ContentItem;
use App\Entity\Course;
use App\Entity\FileItem;
use App\Entity\Issue;
use App\Entity\Report;
use App\Entity\User;
use App\Services\LmsApiService;
use App\Services\PhpAllyService;
use CidiLabs\PhpAlly\PhpAllyIssue;
use Doctrine\Persistence\ManagerRegistry;

class LmsFetchService {

    /** @var App\Services\LmsApiService $lmsApi */
    protected $lmsApi;

    protected $lmsUser;

    /** @var PhpAllyService $phpAllyService */
    private $phpAlly;

    /** @var ManagerRegistry $doctrine */
    protected $doctrine;

    /** @var UtilityService $util */
    protected $util;

    const ISSUE_TYPE_SUGGESTION = 'suggestion';
    const ISSUE_TYPE_ERROR = 'error';

    public function __construct(
        LmsApiService $lmsApi,
        LmsUserService $lmsUser,
        PhpAllyService $phpAlly,
        ManagerRegistry $doctrine,
        UtilityService $util
    )
    {
        $this->lmsApi = $lmsApi;
        $this->lmsUser = $lmsUser;
        $this->phpAlly = $phpAlly;
        $this->doctrine = $doctrine;
        $this->util = $util;
    }

    /**
     * Course Refresh has these steps:
     * 1) Update course structure
     * 2) Find any updated content
     * 3) Create new report
     * 4) Link unchanged issues to new report
     * 5) Process updated content
     */
    public function refreshLmsContent(Course $course, User $user)
    {
        $lms = $this->lmsApi->getLms($user);

        $this->lmsUser->validateApiKey($user);

        /** @var \App\Repository\ContentItemRepository $contentItemRepo */
        $contentItemRepo = $this->doctrine->getManager()->getRepository(ContentItem::class);

        /** @var \App\Repository\FileItemRepository $fileItemRepo */
        $fileItemRepo = $this->doctrine->getManager()->getRepository(FileItem::class);

        /* Step 1: Update content
        /* Update course status */
        $lms->updateCourseData($course, $user);

        /* Mark content items as inactive */
        $contentItemRepo->setCourseContentInactive($course);
        $fileItemRepo->setCourseFileItemsInactive($course);
        $this->doctrine->getManager()->flush();

        /* Update content items from LMS */
        $lms->updateCourseContent($course, $user);

        /* Step 2: Get list of changed content items */
        $contentItems = $contentItemRepo->getUpdatedContentItems($course);

        /* Step 3: Delete issues for updated content items */
        $this->deleteContentItemIssues($contentItems);

        /* Step 4: Process the updated content with PhpAlly and link to report */
        $this->scanContentItems($contentItems);

        /* Step 5: Update report from all active issues */
        $this->updateReport($course, $user);

        /* Save last_updated date on course */
        $course->setLastUpdated($this->util->getCurrentTime());
        $course->setDirty(false);
        $this->doctrine->getManager()->flush();
    }

    // Refresh content item data from the LMS
    // public function refreshContentItemFromLms(ContentItem $contentItem): void
    // {
    //     $lms = $this->lmsApi->getLms();
    //     $lms->updateContentItem($contentItem);
    //     $this->doctrine->getManager()->flush();
    // }

    // Update report, or create new one for a new day
    public function updateReport(Course $course, User $user): Report
    {
        $contentFixed = $contentResolved = $filesReviewed = $errors = $suggestions = 0;
        $scanRules = [];

        /** @var \App\Entity\ContentItem[] $contentItems */
        $contentItems = $course->getContentItems();

        foreach ($contentItems as $contentItem) {
            /** @var \App\Entity\Issue[] $issues */
            $issues = $contentItem->getIssues()->toArray();

            foreach ($issues as $issue) {
                if (Issue::$issueStatusFixed === $issue->getStatus()) {
                    $contentFixed++;
                } else if (Issue::$issueStatusResolved === $issue->getStatus()) {
                    $contentResolved++;
                } else {
                    if (Issue::$issueError === $issue->getType()) {
                        $errors++;
                    } else {
                        $suggestions++;
                    }
                }

                /* Scan rule data */
                $ruleId = $issue->getScanRuleId();
                if (!isset($scanRules[$ruleId])) {
                    $scanRules[$ruleId] = 0;
                }

                $scanRules[$ruleId]++;
            }
        }

        /** @var \App\Entity\FileItem[] $fileItems */
        $fileItems = $course->getFileItems();
        foreach ($fileItems as $file) {
            if ($file->getReviewed()) {
                $filesReviewed++;
            }
        }

        $latestReport = $course->getLatestReport();
        $now = $this->util->getCurrentTime();

        if ($latestReport && ($now->format('m/d/y') === $latestReport->getCreated()->format('m/d/y'))) {
            $report = $latestReport;
        }
        else {
            $report = new Report();
            $report->setAuthor($user);
            $report->setCourse($course);
            $this->doctrine->getManager()->persist($report);
        }

        $report->setCreated($now);
        $report->setReady(false);
        $report->setErrors($errors);
        $report->setSuggestions($suggestions);
        $report->setContentFixed($contentFixed);
        $report->setContentResolved($contentResolved);
        $report->setFilesReviewed($filesReviewed);
        $report->setData(\json_encode(['scanRules' => $scanRules]));

        $this->doctrine->getManager()->flush();

        return $report;
    }

    
    // Performs PHPAlly scan on each Content Item.
    public function scanContentItems(array $contentItems)
    {
        $newIssues = [];

        // Scan each update content item for issues
        /** @var \App\Entity\ContentItem $contentItem */
        foreach ($contentItems as $contentItem) {
            try {
                // Scan Content Item with PHPAlly
                $phpAllyReport = $this->phpAlly->scanContentItem($contentItem);

                if ($phpAllyReport) {
                    // TODO: Do something with report errors
                    if (count($phpAllyReport->getErrors())) {
                        foreach ($phpAllyReport->getErrors() as $error) {
                            $msg = $error . ', item = #' . $contentItem->getId();
                            $this->util->createMessage($msg, 'error', $contentItem->getCourse(), null, true);
                        }
                    }

                    // Add Issues to report
                    foreach ($phpAllyReport->getIssues() as $issue) {
                        // Create issue entity
                        $newIssues[] = $this->createIssue($issue, $contentItem);
                    }
                }
            }
            catch (\Exception $e) {
                $this->util->createMessage($e->getMessage(), 'error', null, null, true);
            }
        }
        $this->doctrine->getManager()->flush();

        return $newIssues;
    }

    public function createIssue(PhpAllyIssue $issue, ContentItem $contentItem)
    {
        $issueEntity = new Issue();
        $meta = $contentItem->getCourse()->getInstitution()->getMetadata();
        $issueType = self::ISSUE_TYPE_ERROR;

        if (isset($meta['SUGGESTION_RULES'])) {
            if (isset($meta['SUGGESTION_RULES'][$issue->getRuleId()])) {
                $issueType = self::ISSUE_TYPE_SUGGESTION;
            }
        }
        if (isset($_ENV['PHPALLY_SUGGESTION_RULES'])) {
            if (strpos($_ENV['PHPALLY_SUGGESTION_RULES'], $issue->getRuleId()) !== false) {
                $issueType = self::ISSUE_TYPE_SUGGESTION;
            }
        }

        $issueEntity->setType($issueType);
        $issueEntity->setStatus(Issue::$issueStatusActive);
        $issueEntity->setContentItem($contentItem);
        $issueEntity->setScanRuleId($issue->getRuleId());
        $issueEntity->setHtml($issue->getHtml());
        $issueEntity->setPreviewHtml($issue->getPreview());
        $issueEntity->setMetadata($issue->getMetadata());

        $contentItem->addIssue($issueEntity);

        $this->doctrine->getManager()->persist($issueEntity);

        return $issueEntity;
    }

    public function deleteContentItemIssues($contentItems, Issue $activeIssue = null)
    {
        $deletedIssueIds = [];

        /** @var \App\Repository\IssueRepository $issueRepo */
        $issueRepo = $this->doctrine->getManager()->getRepository(Issue::class);

        foreach ($contentItems as $contentItem) {
            $deletableIds = [];
            $deletable = $issueRepo->getDeletableContentItemIssues($contentItem, $activeIssue);
            foreach ($deletable as $row) {
                $deletableIds[] = $row->getId();
            }

            $result = $issueRepo->deleteContentItemIssues($contentItem, $activeIssue);

            if ($result) {
                $deletedIssueIds = array_merge($deletedIssueIds, $deletableIds);
            }
        }

        return $deletedIssueIds;
    }

    public function getContentBody(ContentItem $contentItem, User $user)
    {
        $lms = $this->lmsApi->getLms($user);

        return HtmlService::clean($lms->getContentBodyFromLms($contentItem, $user));
    }
}
