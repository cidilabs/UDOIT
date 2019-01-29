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
    public static function setupOauth() {
        global $db_institutes_table;
        $utils = UdoitUtils::instance();

        if (!empty($utils::$canvas_oauth_id)) {
            return;
        }

        $post = filter_input_array(INPUT_POST, FILTER_SANITIZE_STRING);

        if (!empty($post['custom_canvas_api_domain'])) {
            $domain = $post['custom_canvas_api_domain'];

            $sth = UdoitDB::prepare("SELECT * FROM {$db_institutes_table} WHERE domain = :domain");
            $sth->bindValue(':domain', $domain, PDO::PARAM_STR);
            $sth->execute();
            $result = $sth->fetchObject();

            if (!empty($result)) {
                $utils::$canvas_consumer_key = $result->consumer_key;
                $utils::$canvas_secret_key = $result->shared_secret;
                $utils::$canvas_oauth_id = $result->developer_id;
                $utils::$canvas_oauth_key = $result->developer_key;
            }
        }
    }
}
