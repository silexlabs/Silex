import fs from 'fs'
export const connect = {"data":{"__typename":"Query"}}
export const schema = JSON.parse(fs.readFileSync(__dirname + '/schema.json', 'utf8'))
export const postsId = {
  "data": {
    "Query": {
      "posts": [
        {
          "id": "1"
        }
      ]
    }
  }
}
export const postsDetails = {
  "data": {
    "Query": {
      "posts": [
        {
          "author": {
            "email": "jonas.moreau@hotmail.com",
            "first_name": "jonas",
            "avatar": {
              "id": "3666db7d-8ad6-4b90-aa48-c581f1392e44",
              "filename_disk": "3666db7d-8ad6-4b90-aa48-c581f1392e44.webp"
            }
          },
          "title": "Test 1",
          "content": "<p>Lorem ipsum</p>"
        }
      ]
    }
  }
}