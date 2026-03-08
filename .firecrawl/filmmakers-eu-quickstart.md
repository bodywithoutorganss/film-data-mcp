[Skip to main content](https://api.filmmakers.eu/quickstart#__docusaurus_skipToContent_fallback)

[![Filmmakers Logo](https://api.filmmakers.eu/img/logo.svg)](https://api.filmmakers.eu/)

[GitHub repository](https://github.com/denkungsart/filmmakers-api)

Search`` `K`

- [Getting Started](https://api.filmmakers.eu/quickstart#)

  - [Introduction](https://api.filmmakers.eu/)
  - [Quickstart](https://api.filmmakers.eu/quickstart)
  - [Authentication](https://api.filmmakers.eu/authentication)
- [API Reference](https://api.filmmakers.eu/api-reference)
- [Core Concepts](https://api.filmmakers.eu/quickstart#)

- [Resources](https://api.filmmakers.eu/quickstart#)

- [Changelog](https://api.filmmakers.eu/changelog)

- [Home page](https://api.filmmakers.eu/)
- Getting Started
- Quickstart

On this page

# Quickstart

Get up and running with the Filmmakers API in minutes.

## Prerequisites [​](https://api.filmmakers.eu/quickstart\#prerequisites "Direct link to Prerequisites")

Before you begin, you'll need an API key. Request one through [our support page](https://www.filmmakers.eu/contact/new).

## Make Your First Request [​](https://api.filmmakers.eu/quickstart\#make-your-first-request "Direct link to Make Your First Request")

Once you have your API key, you can make your first API call. Let's retrieve a list of actor profiles:

- cURL
- JavaScript (Fetch)
- PHP (cURL)
- Ruby (Net::HTTP)

```shell
curl "https://www.filmmakers.eu/api/v1/actor_profiles?per_page=5" \
  -H "Authorization: Token token=YOUR_API_KEY"
```

```javascript
const API_KEY = 'YOUR_API_KEY';

fetch('https://www.filmmakers.eu/api/v1/actor_profiles?per_page=5', {
  headers: {
    'Authorization': `Token token=${API_KEY}`
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

```php
<?php
$apiKey = 'YOUR_API_KEY';
$url = 'https://www.filmmakers.eu/api/v1/actor_profiles?per_page=5';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [\
    'Authorization: Token token=' . $apiKey\
]);

$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
print_r($data);
```

```ruby
require 'net/http'
require 'json'

api_key = 'YOUR_API_KEY'
uri = URI('https://www.filmmakers.eu/api/v1/actor_profiles?per_page=5')

request = Net::HTTP::Get.new(uri)
request['Authorization'] = "Token token=#{api_key}"

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

data = JSON.parse(response.body)
puts data
```

note

Replace `YOUR_API_KEY` with your actual API key.

## Understanding the Response [​](https://api.filmmakers.eu/quickstart\#understanding-the-response "Direct link to Understanding the Response")

A successful response returns a JSON array of actor profiles:

```json
[\
  {\
    "id": 12345,\
    "display_name": "Jane Doe",\
    "gender": "female",\
    "profile_url": "https://www.filmmakers.eu/actors/jane-doe",\
    "thumbnail_url": "https://...",\
    ...\
  },\
  ...\
]
```

## Pagination [​](https://api.filmmakers.eu/quickstart\#pagination "Direct link to Pagination")

List endpoints return paginated results. Check the `Link` header for navigation:

```text
Link: <https://www.filmmakers.eu/api/v1/actor_profiles?page=2>; rel="next"
```

Use the `page` and `per_page` parameters to navigate:

```shell
curl "https://www.filmmakers.eu/api/v1/actor_profiles?page=2&per_page=25" \
  -H "Authorization: Token token=YOUR_API_KEY"
```

See [Pagination](https://api.filmmakers.eu/pagination) for more details.

## Next Steps [​](https://api.filmmakers.eu/quickstart\#next-steps "Direct link to Next Steps")

- Browse the [API Reference](https://api.filmmakers.eu/api-reference) for a complete list of endpoints
- Learn about [Authentication](https://api.filmmakers.eu/authentication) options including OAuth
- Explore [Actor Profiles](https://api.filmmakers.eu/actor-profiles) and [Crew Profiles](https://api.filmmakers.eu/crew-profiles) endpoints
- Check [Rate Limits](https://api.filmmakers.eu/rate-limits) to understand usage limits

[Edit this page](https://github.com/denkungsart/filmmakers-api/tree/main/docs/quickstart.md)

[Previous\\
\\
Introduction](https://api.filmmakers.eu/) [Next\\
\\
Authentication](https://api.filmmakers.eu/authentication)

- [Prerequisites](https://api.filmmakers.eu/quickstart#prerequisites)
- [Make Your First Request](https://api.filmmakers.eu/quickstart#make-your-first-request)
- [Understanding the Response](https://api.filmmakers.eu/quickstart#understanding-the-response)
- [Pagination](https://api.filmmakers.eu/quickstart#pagination)
- [Next Steps](https://api.filmmakers.eu/quickstart#next-steps)

Docs

- [API Reference](https://api.filmmakers.eu/)

Community

- [Contact Support](https://www.filmmakers.eu/contact/new)

More

- [Back to Filmmakers](https://www.filmmakers.eu/)
- [GitHub](https://github.com/denkungsart/filmmakers-api)

Copyright © 2026 Filmmakers. Built with Docusaurus.