<?php
// Check if the request is a POST request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get the raw POST data
    $json_string = file_get_contents('php://input');

    // Check if the JSON is valid
    json_decode($json_string);
    if (json_last_error() === JSON_ERROR_NONE) {
        // Path to the ips.json file
        $file_path = 'ips.json';

        // Set the timezone to match the user's local time
        date_default_timezone_set('America/Regina');
        
        // Get the current server date
        $server_date = date('Y-m-d');

        // Replace all occurrences of the placeholder with the server date
        $new_json_string = str_replace('"SERVER_DATE_NOW"', '"' . $server_date . '"', $json_string);
        
        // Pretty-print the JSON for storage
        $data = json_decode($new_json_string);
        $new_json_data = json_encode($data, JSON_PRETTY_PRINT);

        // Write the new JSON data to the file
        if (file_put_contents($file_path, $new_json_data) !== false) {
            // Send the updated data back as the response
            header('Content-Type: application/json');
            echo $new_json_data;
        } else {
            // Send an error response if the file could not be written
            http_response_code(500);
            echo json_encode(['message' => 'Error saving IP data.']);
        }
    } else {
        // Send an error response if the JSON is invalid
        http_response_code(400);
        echo json_encode(['message' => 'Invalid JSON data.']);
    }
} else {
    // Send an error response if the request method is not POST
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed.']);
}
?>