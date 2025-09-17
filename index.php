<?php
$serverName = "QAZAFIPC\SQLEXPRESS01";
$connectionOptions = array(
    "Database" => "QazafiFab",
    "Integrated Security" => true
);

// Connect
$conn = sqlsrv_connect($serverName, $connectionOptions);

if ($conn) {
    echo "<h2>✅ Connected to SQL Server</h2>";

    // Run query
    $sql = "SELECT TOP 5 * FROM YourTable";
    $stmt = sqlsrv_query($conn, $sql);

    echo "<table border='1' cellpadding='5'>";
    while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        echo "<tr>";
        foreach ($row as $col) {
            echo "<td>" . $col . "</td>";
        }
        echo "</tr>";
    }
    echo "</table>";

    sqlsrv_close($conn);
} else {
    echo "<h2>❌ Connection failed</h2>";
    die(print_r(sqlsrv_errors(), true));
}
?>
