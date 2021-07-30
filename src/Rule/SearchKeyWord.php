<?php

namespace App\Rule;

use CidiLabs\PhpAlly\Rule\BaseRule;
use DOMElement;


class SearchKeyWord extends BaseRule
{

    public function id()
    {
        return (new \ReflectionClass($this))->getShortName();;
    }

    public function check()
    {
        $pageText = '';
        $wordCount = 0;
        foreach ($this->getAllElements(null, 'text') as $element) {
            $text = $element->nodeValue;

            if($text != null){
                $pageText = $pageText . $text;
            }
        }

        $wordCount = substr_count($pageText, "Ipsum");

        if($wordCount > 0) {
            $this->setIssue($this->dom->documentElement,$this->dom->documentElement,json_encode(array( 'wordCount' => $wordCount)));
        }

        return count($this->issues);
    }

    public function getPreviewElement(DOMElement $a = null)
    {
        return $a;
    }
}