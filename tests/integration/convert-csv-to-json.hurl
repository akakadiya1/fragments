# 1. Try to post a text fragment
# Creates a new fragment with CSV content
POST http://localhost:8080/v1/fragments
Content-Type: text/csv

[BasicAuth]
user1@email.com:password1

# The actual content being sent as a csv fragment
```
Student,marks1,marks2
Student1,32,63
Student2,83,62
Student3,29,30
```

# Expect a 201 Created response upon successful creation
HTTP/1.1 201

# Ensure the YAML output is correct
[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "text/csv"
jsonpath "$.fragment.size" == 67

# Ensure the YAML output is correct
[Captures]
url: header "Location"

# 2. Try to get the CSV data in JSON format
GET {{url}}/json
[BasicAuth]
user1@email.com:password1

# Expect a 200 OK response
HTTP/1.1 200

# Ensure the JSON output is correct
[Asserts]
body == ```
[{"Student":"Student1","marks1":"32","marks2":"63"},{"Student":"Student2","marks1":"83","marks2":"62"},{"Student":"Student3","marks1":"29","marks2":"30"}]```
