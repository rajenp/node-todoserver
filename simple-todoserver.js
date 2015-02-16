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
 * This is inspiration from nzakas's code but this is my own enhanced implementation.
 * This implementation doesn't use express or has no dependency on any other module.
 */
(function () {
    "use strict";
    var http = require("http"),
        tasks = {},
        result404 = {
            code: 404
        },
        result501 = {
            code: 501
        },
        result405 = {
            code: 405
        },
        routes = [],
        SimpleServer = function () {
            var Helper = {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, GET, PUT, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type"
                },
                parseUrl: function (url, routePath) {
                    var paramNames = [],
                        query,
                        params = {},
                        tokens,
                        qTokens,
                        route,
                        match,
                        qIndex = url.indexOf("?");
                    if (qIndex > 0) {
                        query = url.substring(qIndex + 1);
                        url = url.substring(0, qIndex);
                        tokens = query.split("&");
                        tokens.forEach(function (token) {
                            if (token) {
                                qTokens = token.split("=");
                                if (qTokens.length === 2) {
                                    if (typeof qTokens[1] === "string" && qTokens[1].match(/^\s*(true|false)\s*$/img)) {
                                        qTokens[1] = !!qTokens[1].match(/true/img);
                                    }
                                    params[qTokens[0]] = qTokens[1];
                                }
                            }
                        });
                    }
                    route = routePath.replace(/\/\:([^\:\/]+)/img, function () {
                        paramNames.push(arguments[1]);
                        return "/([^\/]+)";
                    });
                    route += "$";
                    match = url.match(route);
                    if (match) {
                        match.shift();
                        match.forEach(function (value) {
                            params[paramNames.shift()] = value;
                        });
                        return params;
                    }
                },
                onRequestBody: function (req, callback) {
                    var fullBody = "",
                        data;
                    req.on("data", function (chunk) {
                        fullBody += chunk.toString();

                    });
                    req.on("end", function () {
                        data = fullBody && JSON.parse(fullBody);

                        callback({
                            data: data
                        });
                    });
                },
                send404: function (res) {
                    res.writeHead(404, "Not Found", this.headers);
                    res.end();
                },
                send405: function (res) {
                    res.writeHead(405, "Method Not Allowed", this.headers);
                    res.end();
                },
                sendJSON: function (res, anObject) {
                    res.write(JSON.stringify(anObject));
                    res.end();
                },
                sendOK: function (res) {
                    res.writeHead(200, "OK", this.headers);
                    res.end();
                },
                sendResult: function (res, result) {
                    result = result || result404;
                    result.message = result.message || http.STATUS_CODES[result.code];
                    if (result.data && typeof result.data === "object") {
                        res.setHeader("Content-Type", "application/json");
                    }
                    res.writeHead(result.code, result.message, Helper.headers);
                    if (!result.data) {
                        res.end();
                    } else {
                        if (typeof result.data === "object") {
                            Helper.sendJSON(res, result.data);
                        } else {
                            res.write(result.data);
                            res.end();
                        }
                    }
                }
            };

            return {

                onRoute: function (routePath, callback) {
                    routes.push({
                        path: routePath,
                        handler: callback
                    });
                    return this;
                },
                process: function (req, res) {
                    console.log("%s - \"%s %s HTTP/%s\"",
                        req.connection.remoteAddress,
                        req.method,
                        req.url,
                        req.httpVersion);
                    //start matching routes in order and start serving
                    var index = 0,
                        length = routes.length,
                        route,
                        result = result404,
                        params,
                        callback = function (body) {
                            req.body = body.data; //inject body
                            result = route.handler(req, res);
                            result = result || result501;
                            Helper.sendResult(res, result);
                        };
                    while (index < length) {
                        route = routes[index];
                        params = Helper.parseUrl(req.url, route.path);
                        if (params) { //this url matches the route
                            req.params = params; //inject path params
                            console.log("Route: ", route.path);
                            if (req.method === "OPTIONS") {
                                result = {
                                    code: 200
                                };
                                break;
                            }
                            if (req.method === "POST" || req.method === "PUT") {
                                Helper.onRequestBody(req, callback);
                                return;
                            }
                            callback({});
                            return;
                        }
                        index += 1;
                    }
                    Helper.sendResult(res, result);
                }
            };
        },
        server = new SimpleServer().onRoute("/todo/tasks",
            function () {
                var data = Object.keys(tasks).map(function (key) {
                    return tasks[key];
                });
                return {
                    code: 200,
                    data: data
                };
            }).onRoute("/todo/tasks/create",
            function (req) {
                if (req.method !== "POST") {
                    return result405;
                }
                var task = req.body;
                if (!task) {
                    return result404;
                }
                task.id = Date.now ? Date.now() : new Date().getTime();
                tasks[task.id] = task;
                return {
                    code: 200,
                    data: task
                };
            }).onRoute("/todo/tasks/search",
            function (req) {
                if (req.method !== "GET") {
                    return result405;
                }
                var queryMap = req.params,
                    queryKeys = queryMap && Object.keys(queryMap),
                    list = [],
                    aTask;
                console.log(queryMap);
                if (!queryKeys || !queryKeys.length) {
                    list = Object.keys(tasks).map(function (key) {
                        return tasks[key];
                    });
                } else {
                    list = Object.keys(tasks).filter(function (key) {
                        aTask = tasks[key];
                        return queryKeys.some(function (prop) {
                            var checkValue = queryMap[prop];
                            return ((!checkValue && typeof aTask[prop] === "undefined") || checkValue === aTask[prop]); //prop doesn't exist or matches
                        });
                    }).map(function (validKey) { //matching keys
                        return tasks[validKey];
                    });
                }
                return {
                    code: 200,
                    data: list
                };
            }).onRoute("/todo/tasks/:id/edit",
            function (req) {
                if (req.method !== "PUT") {
                    return result405;
                }
                var params = req.params,
                    data = req.body,
                    task = tasks[params.id];
                if (!task || !data) {
                    return {
                        code: 404
                    };
                }
                if (task && data) {
                    Object.keys(data).forEach(function (key) {
                        if (key !== "id") { //id update not allowed
                            task[key] = data[key];
                        }
                    });
                    return {
                        code: 200,
                        data: task
                    };
                }
                /*}).onRoute("/.*",
                function (req, res) { //TODO sending correct content-type header
                    var result = {},
                        fs = require("fs");
                    var filePath = "./" + req.url;
                    if (req.url === "/") {
                        filePath = "./index.html";
                    }
                    try {
                        var file = !req.url.match(/.*\/$/) && fs.readFileSync(require("path").resolve(__dirname, filePath), "utf8");
                        if (file) {
                            result.code = 200;
                            result.data = file;
                        } else {
                            result.code = 404;
                        }
                    } catch (ex) {
                        result.code = 404;
                        result.message = "Not Found";
                    }
                    return result;*/
            }).onRoute("/todo/tasks/:id/delete",
            function (req) {
                if (req.method !== "DELETE") {
                    return result405;
                }
                var params = req.params,
                    taskId = params.id,
                    task = tasks[taskId];
                if (!task) {
                    return {
                        code: 404
                    };
                }
                delete tasks[taskId];
                return {
                    code: 200,
                    data: task
                };

            });

    http.createServer(server.process).listen(9898);
    console.log("Simple todoserver is ready to accept requests on port 9898");
}());
