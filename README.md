# node-todoserver
Node JS based simple TODO server 

# About

* This is simple todo server for my TODO App - https://github.com/rpatil26/js-todos
* Code implements simple routing mechanism to map handlers to the URLs
* Implemented URL path variable mapping to the pathParam variables to be available in handler
* It has no dependency on external modules
* Used plain node js and built in "http" and "fs" modules
* Supports static content serving (Content-Type, Caching pending) (Commented for now)
* Runs on port 9898

# To Run
```node simple-todoserver.js```

# APIs (REST)
Accepts and serves ```application/json``` content. Send JSON string as body for the POST method 
* **GET** ```/todo/tasks``` - Lists all the todos 
* **POST** ```/todo/tasks/create``` - Create a todo 
  * Send any JSON object string as body eg. {task:"Something", complete: false}
  * Property id is assigned to it, which is long time (new Date().getTime())
* **PUT** ```/todo/tasks/:id/edit```
  * Send object similar to create with the properties you want to append to the task with specified id
  * Doesn't allow changing id property
* **DELETE** ```/todo/tasks/:id/delete``` - Delete the todo identified by specified id
* **GET** ```/todo/tasks/search?prop=value``` - Search the todos matching specified property and value
