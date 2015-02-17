/*
 * Copyright 2015 Rajendra Patil
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Node JS based Simple TODO server
 * @author Rajendra Patil
 * This is inspiration from nzakas's code and now uses my npm "serve-route" (https://www.npmjs.com/package/serve-route)
 * This implementation doesn't use express or has no dependency on any other module.
 */
(function () {
    "use strict";
    var tasks = {},
        corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, GET, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        },
        server = require("serve-route").server,
        addCorsHeaders = function (params) {
            params.headers = corsHeaders;
            return params;
        };

    // Define routes
    server.onOptions("/todo/tasks/?.*", function () {
        return addCorsHeaders({
            code: 200
        });
    }).onGet("/todo/tasks",
        function () {
            var data = Object.keys(tasks).map(function (key) {
                return tasks[key];
            });
            return addCorsHeaders({
                code: 200,
                data: data
            });
        }).onPost("/todo/tasks/create",
        function (req) {
            var task = req.body;
            if (!task) {
                return {code:404};
            }
            task.id = Date.now ? Date.now() : new Date().getTime();
            tasks[task.id] = task;
            return addCorsHeaders({
                code: 200,
                data: task
            });
        }).onGet("/todo/tasks/search",
        function (req) {
            var queryMap = req.params,
                queryKeys = queryMap && Object.keys(queryMap),
                list = [],
                aTask;
            if (!queryKeys || !queryKeys.length) {
                list = Object.keys(tasks).map(function (key) {
                    return tasks[key];
                });
            } else {
                list = Object.keys(tasks).filter(function (key) {
                    aTask = tasks[key];
                    return queryKeys.some(function (prop) {
                        if (!prop) {
                            return false;
                        }
                        var checkValue = queryMap[prop];
                        if (typeof checkValue === "string" && checkValue.match(/^\s*(true|false)\s*$/img)) {
                            checkValue = !!checkValue.match(/true/img);
                        }
                        return ((!checkValue && typeof aTask[prop] === "undefined") || checkValue === aTask[prop]); //prop doesn't exist or matches
                    });
                }).map(function (validKey) { //matching keys
                    return tasks[validKey];
                });
            }
            return addCorsHeaders({
                code: 200,
                data: list
            });
        }).onPut("/todo/tasks/:id/edit",
        function (req) {
            var params = req.params,
                data = req.body,
                task = tasks[params.id];
            if (!task || !data) {
                return addCorsHeaders({
                    code: 404
                });
            }
            if (task && data) {
                Object.keys(data).forEach(function (key) {
                    if (key !== "id") { //id update not allowed
                        task[key] = data[key];
                    }
                });
                return addCorsHeaders({
                    code: 200,
                    data: task
                });
            }

        }).onDelete("/todo/tasks/:id/delete",
        function (req) {
            var params = req.params,
                taskId = params.id,
                task = tasks[taskId];
            if (!task) {
                return addCorsHeaders({
                    code: 404
                });
            }
            delete tasks[taskId];
            return addCorsHeaders({
                code: 200,
                data: task
            });

        });

    server.start(9898);
    console.log("Started on port " + 9898);

}());
