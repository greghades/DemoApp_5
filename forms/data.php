<?php

    $tasks = array(
        'items' => array(
            array(
                'title' => 'Task 1',
                'date' => '2022-06-23',
                'status' => 'pendiente'
            ),
            array(
                'title' => 'Task 2',
                'date' => '2022-06-25',
                'status' => 'completado'
            ),
            array(
                'title' => 'Task 3',
                'date' => '2022-06-27',
                'status' => 'pendiente'
            ),
            array(
                'title' => 'Task 4',
                'date' => '2022-06-29',
                'status' => 'completado'
            )
        )
    );

    echo json_encode($tasks);