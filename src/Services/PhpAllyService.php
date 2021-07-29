<?php

namespace App\Services;

use App\Entity\ContentItem;
use CidiLabs\PhpAlly\PhpAlly;

class PhpAllyService {
    
    protected $phpAlly;

    /** @var App\Service\HtmlService */
    protected $htmlService;

    protected $util;
    
    public function __construct(HtmlService $htmlService, UtilityService $util)
    {
        $this->phpAlly = new PhpAlly();    
        $this->htmlService = $htmlService;
        $this->util = $util;
    }

    public function scanContentItem(ContentItem $contentItem)
    {
        $html = HtmlService::clean($contentItem->getBody());
        if (!$html) {
            return;
        }

        $options = [
            'backgroundColor' => !empty($_ENV['BACKGROUND_COLOR']) ? $_ENV['BACKGROUND_COLOR'] : '#ffffff',
            'textColor' => !empty($_ENV['TEXT_COLOR']) ? $_ENV['TEXT_COLOR'] : '#000000',
            'vimeoApiKey' => !empty($_ENV['VIMEO_API_KEY']) ? $_ENV['VIMEO_API_KEY'] : '',
            'youtubeApiKey' => !empty($_ENV['YOUTUBE_API_KEY']) ? $_ENV['YOUTUBE_API_KEY'] : ''
        ];
        
        return $this->phpAlly->checkMany($html, $this->getRules(), $options);
    }

    public function scanHtml($html, $rules = [])
    {
        $html = HtmlService::clean($html);

        if (empty($rules)) {
            $rules = $this->getRules();
        }

        $options = [
            'backgroundColor' => !empty($_ENV['BACKGROUND_COLOR']) ? $_ENV['BACKGROUND_COLOR'] : '#ffffff',
            'textColor' => !empty($_ENV['TEXT_COLOR']) ? $_ENV['TEXT_COLOR'] : '#000000',
            'vimeoApiKey' => !empty($_ENV['VIMEO_API_KEY']) ? $_ENV['VIMEO_API_KEY'] : '',
            'youtubeApiKey' => !empty($_ENV['YOUTUBE_API_KEY']) ? $_ENV['YOUTUBE_API_KEY'] : ''
        ];
        
        return $this->phpAlly->checkMany($html, $rules, $options);
    }

    public function getRules()
    {
        $allRules = $this->phpAlly->getRuleIds();
        $customRules = $this->getCustomRules();

        $envExclusions = $this->getEnvExcludedRules();
        $dbExclusions = $this->getDbExcludedRules();

        return array_values(array_merge(array_diff($allRules, $envExclusions, $dbExclusions), $customRules));
    }

    protected function getEnvExcludedRules()
    {
        return array_map('trim', explode(',', $_ENV['PHPALLY_EXCLUDED_RULES']));
    }

    protected function getCustomRules()
    {
        if(isset($_ENV['CUSTOM_RULES']) && strlen($_ENV['CUSTOM_RULES']) > 0)
        {
            return array_map('trim', explode(',', $_ENV['CUSTOM_RULES']));
        }
        else
        {
            return [];
        }
    }

    protected function getDbExcludedRules()
    {
        // TODO: To be implemented with the admin section
        return [];
    }

}