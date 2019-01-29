<?php
/*
 *
 */
class UdoitMultiTenant {

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