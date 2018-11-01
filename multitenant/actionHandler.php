<?php

require_once('../config/settings.php');
session_start();

/**
 * Verify that .htaccess and .htpasswd files exist. Very basic security check, but it offers a reminder to the end user.
 *
 * @return bool
 */
function multitenant_check_security()
{
    $secure = false;

    if (file_exists('.htaccess')) {
        if (file_exists('.htpasswd')) {
            $secure = true;
        }
    }

    return $secure;
}

function multitenant_handle_request()
{
    $get_vars = filter_input_array(INPUT_GET, FILTER_SANITIZE_STRING);
    $action = isset($get_vars['action']) ? $get_vars['action'] : null;
    $domain = isset($get_vars['domain']) ? $get_vars['domain'] : null;

    if ($domain && $action) {
        switch ($action) {
            case 'delete':
                multitenant_institute_delete($domain);
                break;
            case 'insert':
                multitenant_institute_insert($domain);
                break;
        }

        header('Location: index.php');
        exit;
    }
}

/**
 * Returns a list of institutes.
 *
 * @return mixed
 */
function multitenant_get_institutes()
{
    try {
        $query = UdoitDB::prepare('SELECT * FROM institutes');
        $query->execute();

        return $query->fetchAll(PDO::FETCH_CLASS);
    }
    catch (\Exception $e) {
        return [];
    }
}

/**
 * Deletes an institute from the DB.
 *
 * @param $domain
 */
function multitenant_institute_delete($domain)
{
    $query = UdoitDB::prepare('DELETE FROM institutes WHERE domain = :domain');
    $query->bindParam(':domain', $domain, PDO::PARAM_STR);
    $query->execute();
}

/**
 * Inserts an institute into the DB.
 *
 * @param $domain
 */
function multitenant_institute_insert($domain)
{
    if (!multitenant_institute_exists($domain)) {
        $data = [
            'domain' => $domain,
            'consumer_key' => multitenant_generate_consumer_key($domain),
            'shared_secret' => multitenant_generate_shared_secret($domain),
        ];

        UdoitDB::prepare('INSERT INTO institutes (domain, consumer_key, shared_secret, date_created) VALUES (:domain, :consumer_key, :shared_secret, now())')
            ->execute($data);
    } else {
        $_SESSION['messages'][] = 'Domain already exists.';
    }
}

/**
 * Checks to see if domain exists in the db currently.
 *
 * @param $domain
 *
 * @return mixed
 */
function multitenant_institute_exists($domain) {
    $exists_query = UdoitDB::prepare('SELECT domain FROM institutes WHERE domain = :domain');
    $exists_query->bindValue(':domain', $domain, PDO::PARAM_STR);
    $exists_query->execute();

    return $exists_query->fetchObject();
}

function multitenant_generate_consumer_key($domain)
{
    return 'udoit.'.str_replace(['.instructure.com', '.instructure.edu'], '', $domain);
}

function multitenant_generate_shared_secret($domain)
{
    return uniqid('udoit');
}

function multitenant_print_messages()
{
    $out = '';

    foreach ($_SESSION['messages'] as $message) {
        $out .= '<div class="alert alert-info">'.$message.'</div>';
    }
    unset($_SESSION['messages']);

    return $out;
}
