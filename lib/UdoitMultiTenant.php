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
class UdoitMultiTenant
{
    public static function setupOauth()
    {
        global $oauth2_id;
        global $oauth2_key;
        global $consumer_key;
        global $shared_secret;
        global $db_institutes_table;
        global $db_user_table;
        global $db_reports_table;

        $utils = UdoitUtils::instance();

        if (!empty($utils::$canvas_oauth_id)) {
            return;
        }

        session_start();

        $post = filter_input_array(INPUT_POST, FILTER_SANITIZE_STRING);

        if (!empty($post['custom_canvas_api_domain'])) {
            $domain = $post['custom_canvas_api_domain'];
        } elseif (!empty($_SESSION['base_url'])) {
            $domain = parse_url($_SESSION['base_url'], PHP_URL_HOST);
        }

        if (!empty($domain)) {
            $sth = UdoitDB::prepare("SELECT * FROM {$db_institutes_table} WHERE domain = :domain OR vanity_url = :vanity");
            $sth->bindValue(':domain', $domain, PDO::PARAM_STR);
            $sth->bindValue(':vanity', $domain, PDO::PARAM_STR);
            $sth->execute();
            $result = $sth->fetchObject();

            if (!empty($result)) {
                $utils::$canvas_consumer_key = $consumer_key = $result->consumer_key;
                $utils::$canvas_secret_key = $shared_secret = $result->shared_secret;
                $utils::$canvas_oauth_id = $oauth2_id = $result->developer_id;
                $utils::$canvas_oauth_key = $oauth2_key = $result->developer_key;

                if (isset($result->slug)) {
                    $db_user_table = $result->slug.'_'.$db_user_table;
                    $db_reports_table = $result->slug.'_'.$db_reports_table;
                }
            }
        }
    }
}
