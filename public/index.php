<?php
/**
*   Copyright (C) 2014 University of Central Florida, created by Jacob Bates, Eric Colon, Fenel Joseph, and Emily Sachs.
*
*   This program is free software: you can redistribute it and/or modify
*   it under the terms of the GNU General Public License as published by
*   the Free Software Foundation, either version 3 of the License, or
*   (at your option) any later version.
*
*   This program is distributed in the hope that it will be useful,
*   but WITHOUT ANY WARRANTY; without even the implied warranty of
*   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*   GNU General Public License for more details.
*
*   You should have received a copy of the GNU General Public License
*   along with this program.  If not, see <http://www.gnu.org/licenses/>.
*
*   Primary Author Contact:  Jacob Bates <jacob.bates@ucf.edu>
*/

require_once(__DIR__.'/../config/settings.php');

global $logger;

function isEmpty($teststr)
{
    $trimstr = trim($teststr);

    return empty($trimstr);
}

// Log the absence of video API keys
if (isEmpty(constant('GOOGLE_API_KEY'))) {
    $logger->addWarning('Google API Key empty. Videos will be marked for manual inspection.');
}

if (isEmpty(constant('VIMEO_API_KEY'))) {
    $logger->addWarning('Vimeo API Key empty. Videos will be marked for manual inspection.');
}


// Sanitize post parameters
$post_input = filter_input_array(INPUT_POST, FILTER_SANITIZE_STRING);
$post_input['custom_canvas_user_id'] = filter_input(INPUT_POST, 'custom_canvas_user_id', FILTER_SANITIZE_NUMBER_INT);
$post_input['custom_canvas_course_id'] = filter_input(INPUT_POST, 'custom_canvas_course_id', FILTER_SANITIZE_NUMBER_INT);
$post_input['custom_canvas_root_account_id'] = filter_input(INPUT_POST, 'custom_canvas_root_account_id', FILTER_SANITIZE_NUMBER_INT);

// verify we have the variables we need from the LTI launch
$expect = ['oauth_consumer_key', 'custom_canvas_api_domain', 'custom_canvas_user_id', 'ext_roles', ];
foreach ($expect as $key) {
    if (empty($post_input[$key])) {
        UdoitUtils::instance()->exitWithPageError("Missing LTI launch information. Please ensure that your instance of UDOIT is installed to Canvas correctly. Missing: {$key}");
    }
}

// verify LTI launch
if (!UdoitUtils::instance()->verifyBasicLTILaunch()) {
    UdoitUtils::instance()->exitWithPageError('LTI/Oauth verification problem, please ensure that your instance of UDOIT is configured correctly.');
}

// store LTI launch variables
session_start();
$user_id                     = $post_input['custom_canvas_user_id'];
UdoitUtils::$canvas_base_url = rtrim("https://{$post_input['custom_canvas_api_domain']}", '/');
$_SESSION['base_url']        = UdoitUtils::$canvas_base_url;
$_SESSION['launch_params']   = [
    'custom_canvas_user_id'         => $post_input['custom_canvas_user_id'],
    'custom_canvas_course_id'       => $post_input['custom_canvas_course_id'],
    'custom_canvas_user_login_id'   => $post_input['custom_canvas_user_login_id'],
    'custom_canvas_root_account_id' => $post_input['custom_canvas_root_account_id'],
    'context_label'                 => $post_input['context_label'],
    'context_title'                 => $post_input['context_title'],
    'ext_roles'                     => $post_input['ext_roles'],
];

// Figure out if they're an Admin and set the session variable accordingly
if (strpos($_SESSION['launch_params']['ext_roles'], 'Administrator') !== false) {
    $_SESSION['is_admin'] = true;
} else {
    $_SESSION['is_admin'] = false;
}

// Default to scanner if no destination is specified
if (isset($_GET['d'])) {
    $_SESSION['destination'] = filter_input(INPUT_GET, 'd', FILTER_SANITIZE_STRING);
} else {
    $_SESSION['destination'] = 'scanner';
}

$api_key = UdoitUtils::instance()->getValidRefreshedApiKey($user_id);

if (!empty($api_key)) {
    if ($_SESSION['destination'] === 'admin') {
        if (empty($post_input['custom_canvas_root_account_id'])) {
            UdoitUtils::instance()->exitWithPageError("Missing LTI launch information. Please ensure that your instance of UDOIT is installed to Canvas correctly. Missing: custom_canvas_root_account_id");
        }
        $redirect_to = 'admin.php';
    } elseif ($_SESSION['destination'] === 'scanner') {
        if (empty($post_input['custom_canvas_course_id'])) {
            UdoitUtils::instance()->exitWithPageError("Missing LTI launch information. Please ensure that your instance of UDOIT is installed to Canvas correctly. Missing: custom_canvas_course_id");
        }
        $redirect_to = 'scanner.php';
    }
} else {
    $scopes_encoded = '';

    if (true === $oauth2_enforce_scopes) {
        // if we are enforcing scopes we need to take our predefined scope array
        // and implode it to be a long string with spaces between each scope
        // and then URL encode it.
        $scopes_encoded = '&scope='.urlencode(implode(" ", $oauth2_scopes));
    }

    $redirect_to = "{$_SESSION['base_url']}/login/oauth2/auth/?client_id={$oauth2_id}&response_type=code&redirect_uri={$oauth2_uri}{$scopes_encoded}";
}

if (isset($_GET['localdev'])) {
    $_SESSION['localdev'] = $_GET['localdev'];
}

header("Location: {$redirect_to}");
