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
        $institution = $contentItem->getCourse()->getInstitution();
        if (!$html) {
            return;
        }

        $options = [
            'backgroundColor' => !empty($_ENV['BACKGROUND_COLOR']) ? $_ENV['BACKGROUND_COLOR'] : '#ffffff',
            'textColor' => !empty($_ENV['TEXT_COLOR']) ? $_ENV['TEXT_COLOR'] : '#000000',
            'vimeoApiKey' => !empty($_ENV['VIMEO_API_KEY']) ? $_ENV['VIMEO_API_KEY'] : '',
            'youtubeApiKey' => !empty($_ENV['YOUTUBE_API_KEY']) ? $_ENV['YOUTUBE_API_KEY'] : '',
            'kalturaApiKey' => !empty($_ENV['KALTURA_API_KEY']) ? $_ENV['KALTURA_API_KEY'] : $this->getDbKalturaCredentials($institution, 'KALTURA_API_KEY'),
            'kalturaUsername' => !empty($_ENV['KALTURA_USERNAME']) ? $_ENV['KALTURA_USERNAME'] : $this->getDbKalturaCredentials($institution, 'KALTURA_USERNAME')

        ];
        
        return $this->phpAlly->checkMany($html, $this->getRules(), $options);
    }

    public function scanHtml($html, $rules = [], $institution)
    {
        $html = HtmlService::clean($html);

        if (empty($rules)) {
            $rules = $this->getRules();
        }

        $options = [
            'backgroundColor' => !empty($_ENV['BACKGROUND_COLOR']) ? $_ENV['BACKGROUND_COLOR'] : '#ffffff',
            'textColor' => !empty($_ENV['TEXT_COLOR']) ? $_ENV['TEXT_COLOR'] : '#000000',
            'vimeoApiKey' => !empty($_ENV['VIMEO_API_KEY']) ? $_ENV['VIMEO_API_KEY'] : '',
            'youtubeApiKey' => !empty($_ENV['YOUTUBE_API_KEY']) ? $_ENV['YOUTUBE_API_KEY'] : '',
            'kalturaApiKey' => !empty($_ENV['KALTURA_API_KEY']) ? $_ENV['KALTURA_API_KEY'] : $this->getDbKalturaCredentials($institution, 'KALTURA_API_KEY'),
            'kalturaUsername' => !empty($_ENV['KALTURA_USERNAME']) ? $_ENV['KALTURA_USERNAME'] : $this->getDbKalturaCredentials($institution, 'KALTURA_USERNAME')

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

    protected function getDbKalturaCredentials($institution, $value)
    {
        $metadata = $institution->getMetadata();

        return isset($metadata[$value]) ? $metadata[$value] : '';
    }

}