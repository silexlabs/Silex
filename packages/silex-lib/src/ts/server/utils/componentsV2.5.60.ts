export default {
  'aligned-container': {
      'name': 'Right aligned container',
      'description': 'This is a container which is fixed on the right side of its parent. You choose if you want it to scroll with the content or stay fixed.',
      'doc': null,
      'category': 'Smart Containers',
      'tags': [
          'ui',
          'ux',
          'website'
      ],
      'isPrivate': true,
      'baseElement': 'container',
      'faIconClass': 'fa-align-right',
      'props': [{
              'name': 'vertical',
              'type': [
                  'none',
                  'top',
                  'center',
                  'bottom',
                  'full-height'
              ],
              'default': 'none',
              'description': 'How to align the container vertically.'
          },
          {
              'name': 'horizontal',
              'type': [
                  'none',
                  'left',
                  'center',
                  'right',
                  'full-width'
              ],
              'default': 'none',
              'description': 'How to align the container horizontally.'
          },
          {
              'name': 'fixed',
              'type': 'boolean',
              'default': false,
              'description': 'Stay fixed when the user scrolls (visible only in preview).'
          },
          {
              'name': 'onTop',
              'type': 'boolean',
              'default': false,
              'description': 'On top of the other elements (z-index: 10).'
          }
      ]
  },
  'animated-container': {
      'name': 'Animated Container',
      'description': 'This container will appear with an animation (visible in preview only).',
      'doc': null,
      'category': 'Smart Containers',
      'tags': [
          'ui',
          'ux',
          'website',
          'anim'
      ],
      'isPrivate': true,
      'dependencies': {
          'script': [{
              'src': 'https://unpkg.com/scrollreveal/dist/scrollreveal.min.js'
          }]
      },
      'baseElement': 'container',
      'faIconClass': 'fa-arrows',
      'props': [{
              'name': 'origin',
              'type': [
                  'left',
                  'right',
                  'top',
                  'bottom'
              ],
              'default': 'left',
              'description': 'Origin of the animation, e.g. from left.'
          },
          {
              'name': 'distance',
              'type': 'string',
              'default': '20px',
              'description': 'Distance where animation starts, e.g. \'5rem\', \'10%\', \'20vw\', etc.'
          },
          {
              'name': 'duration',
              'type': 'number',
              'default': 500,
              'description': 'Duration in milliseconds.'
          },
          {
              'name': 'delay',
              'type': 'number',
              'default': 0,
              'description': 'Delay in milliseconds.'
          },
          {
              'name': 'rotateX',
              'type': 'number',
              'default': 0,
              'description': 'Starting rotation. X angle in degrees. Will transition from these values to 0 in all axes.'
          },
          {
              'name': 'rotateY',
              'type': 'number',
              'default': 0,
              'description': 'Starting rotation. Y angle in degrees. Will transition from these values to 0 in all axes.'
          },
          {
              'name': 'rotateZ',
              'type': 'number',
              'default': 0,
              'description': 'Starting rotation. Z angle in degrees. Will transition from these values to 0 in all axes.'
          },
          {
              'name': 'opacity',
              'type': 'number',
              'default': 0,
              'description': 'Starting opacity value, before transitioning to the computed opacity.'
          },
          {
              'name': 'scale',
              'type': 'number',
              'default': 0.9,
              'description': 'Starting scale value, will transition from this value to 1'
          },
          {
              'name': 'easing',
              'type': [
                  'linear',
                  'ease',
                  'ease-in',
                  'ease-in-out',
                  'ease-out'
              ],
              'default': 'linear',
              'description': 'Easing function (CSS easing)'
          },
          {
              'name': 'reset',
              'type': 'boolean',
              'default': false,
              'description': 'Repeat animation every time elements become visible or only once as elements become visible'
          },
          {
              'name': 'beforeReveal',
              'type': 'action',
              'description': 'Callbacks that fire for each triggered element reveal.'
          },
          {
              'name': 'beforeReset',
              'type': 'action',
              'description': 'Callbacks that fire for each triggered element reset.'
          },
          {
              'name': 'afterReveal',
              'type': 'action',
              'description': 'Callbacks that fire for each completed element reveal.'
          },
          {
              'name': 'afterReset',
              'type': 'action',
              'description': 'Callbacks that fire for each completed element reset.'
          }
      ]
  },
  'autosize-section': {
      'name': 'Autosize Section',
      'description': 'This is a section which automatically takes the size of its content.',
      'doc': null,
      'category': 'Dynamic list',
      'tags': [
          'ui',
          'ux',
          'website',
          'dynamic data'
      ],
      'isPrivate': true,
      'baseElement': 'section',
      'faIconClass': 'fa-arrows-v',
      'props': [{
          'name': 'margin',
          'type': 'number',
          'description': 'Margin at the bottom of the last element.',
          'default': 20
      }]
  },
  'form': {
      'name': 'Contact Form',
      'description': 'This is a form which let your visitors get in touch with you.',
      'doc': 'https://github.com/silexlabs/Silex/wiki/Contact-form-component',
      'category': 'Utils',
      'tags': [
          'ui',
          'ux',
          'website',
          'form',
          'contact',
          'email'
      ],
      'isPrivate': false,
      'baseElement': 'html',
      'faIconClass': 'fa-server',
      'initialCssClass': 'silex-use-height-not-minheight silex-element-content-full-height',
      'initialCss': {
          'width': '400px',
          'height': '400px',
          'background-color': 'transparent'
      },
      'props': [{
              'name': 'sendTo',
              'expandable': true,
              'type': 'string',
              'default': 'your@email.com',
              'description': 'Your email (use formspree) or the URL of your server where the form will send data.'
          },
          {
              'name': 'submitButtonLabel',
              'expandable': true,
              'type': 'string',
              'default': 'Send'
          },
          {
              'name': 'buttonTextColor',
              'expandable': true,
              'type': 'color',
              'default': '#FFFFFF'
          },
          {
              'name': 'buttonBackgroundColor',
              'expandable': true,
              'type': 'color',
              'default': '#4CAF50'
          },
          {
              'name': 'buttonBorderColor',
              'expandable': true,
              'type': 'color',
              'default': '#4CAF50'
          },
          {
              'name': 'labelTextColor',
              'expandable': true,
              'type': 'color',
              'default': '#000000'
          },
          {
              'name': 'field1',
              'expandable': true,
              'type': 'boolean',
              'default': true
          },
          {
              'name': 'label1',
              'expandable': true,
              'type': 'string',
              'default': 'Name'
          },
          {
              'name': 'placeholder1',
              'expandable': true,
              'type': 'string',
              'default': 'Your name'
          },
          {
              'name': 'field2',
              'expandable': true,
              'type': 'boolean',
              'default': true
          },
          {
              'name': 'label2',
              'expandable': true,
              'type': 'string',
              'default': 'Your email adress'
          },
          {
              'name': 'placeholder2',
              'expandable': true,
              'type': 'string',
              'default': 'your@email.com'
          },
          {
              'name': 'field3',
              'expandable': true,
              'type': 'boolean',
              'default': true
          },
          {
              'name': 'label3',
              'expandable': true,
              'type': 'string',
              'default': 'Your message'
          },
          {
              'name': 'placeholder3',
              'expandable': true,
              'type': 'string',
              'default': 'What you have to say'
          },
          {
              'name': 'onsubmit',
              'expandable': true,
              'type': 'action',
              'description': 'Fires when the form is about to be submitted. Use the \'event\' object or return false to prevent submit.'
          }
      ]
  },
  'full-width': {
      'name': 'Full width',
      'description': 'A "full width" section, with its content forced 100% width.',
      'doc': 'https://github.com/silexlabs/Silex/wiki/full-width',
      'category': 'UI',
      'tags': [
          'section',
          'ui'
      ],
      'isPrivate': true,
      'baseElement': 'section',
      'initialCssClass': 'full-width-section',
      'faIconClass': 'fa-list-alt',
      'props': []
  },
  'hamburger': {
      'name': 'Hamburger Menu',
      'description': 'A "hamburger" menu for your site. Apply styles to the links with the style editor.',
      'doc': 'https://github.com/silexlabs/Silex/wiki/Hamburger-menu',
      'category': 'UI',
      'tags': [
          'menu',
          'ui',
          'responsive',
          'nav',
          'navigation'
      ],
      'isPrivate': false,
      'baseElement': 'text',
      'faIconClass': 'fa-bars',
      'initialCssClass': 'prevent-resizable prevent-auto-z-index',
      'initialCss': {
          'min-height': '27px',
          'width': '33px',
          'background-color': 'transparent'
      },
      'props': [{
              'name': 'fixed',
              'expandable': false,
              'type': 'boolean',
              'className': 'half-col',
              'default': false,
              'description': 'Does the hamburger icon stay when you scroll?'
          },
          {
              'name': 'style',
              'expandable': false,
              'type': [
                  'left',
                  'full-width'
              ],
              'className': 'half-col',
              'default': 'left',
              'description': 'Does the hamburger icon stay when you scroll?'
          },
          {
              'name': 'button-background-color',
              'displayName': 'Button Color',
              'expandable': false,
              'className': 'half-col',
              'type': 'color',
              'default': '#000000',
              'description': 'Background color of the hamburger button'
          },
          {
              'name': 'button-border-color',
              'displayName': 'Button border',
              'expandable': false,
              'className': 'half-col',
              'type': 'color',
              'default': '#ffffff',
              'description': 'Color of the border of the hamburger button'
          },
          {
              'name': 'background-color',
              'displayName': 'Bg color',
              'expandable': false,
              'className': 'half-col',
              'type': 'color',
              'default': '#ededed',
              'description': 'Background color of the menu when it is open'
          },
          {
              'name': 'links',
              'displayName': 'Menu links',
              'default': [],
              'description': 'Content of the menu',
              'type': [{
                      'name': 'text',
                      'hideTitle': true,
                      'type': 'string',
                      'placeholder': 'Text',
                      'description': 'The text for the element in the menu'
                  },
                  {
                      'name': 'properties',
                      'hideTitle': true,
                      'displayName': 'link',
                      'type': 'link',
                      'description': 'The link properties'
                  }
              ]
          }
      ]
  },
  'hero-center': {
      'name': 'Centered content',
      'description': 'This is the centered content in a hero section component. It is a container which is automatically centered vertically.',
      'doc': 'https://en.wikipedia.org/wiki/Hero_image',
      'category': 'Hero Section',
      'tags': [
          'ui',
          'ux',
          'website'
      ],
      'isPrivate': true,
      'baseElement': 'container',
      'faIconClass': 'fa-address-card-o',
      'initialCss': {
          'background-color': 'transparent'
      },
      'initialCssClass': 'hero-center',
      'props': []
  },
  'hero-scroll-bottom': {
      'name': 'Scroll down',
      'description': 'This is a clickable area to scroll down to the content in a hero section component. It is a container which is automatically moved at the bottom of the hero section.',
      'doc': 'https://en.wikipedia.org/wiki/Hero_image',
      'category': 'Hero Section',
      'tags': [
          'ui',
          'ux',
          'website'
      ],
      'isPrivate': true,
      'baseElement': 'container',
      'faIconClass': 'fa-angle-double-down',
      'initialCss': {
          'background-color': 'transparent'
      },
      'initialCssClass': 'hero-bottom hero-scroll',
      'props': []
  },
  'hero-section': {
      'name': 'Hero Section',
      'description': 'This is a hero section component, which takes the whole screen. You can add elements to the section and use the css classes "hero-center", "hero-bottom", "hero-scroll"',
      'doc': 'https://en.wikipedia.org/wiki/Hero_image',
      'category': 'Hero Section',
      'tags': [
          'ui',
          'ux',
          'website'
      ],
      'isPrivate': true,
      'baseElement': 'section',
      'faIconClass': 'fa-header',
      'initialCss': {
          'min-height': '400px'
      },
      'initialCssContentContainer': {
          'background-color': 'transparent'
      },
      'props': [{
              'name': 'width',
              'type': 'number',
              'description': 'Width in %',
              'default': 100
          },
          {
              'name': 'align',
              'type': [
                  'left',
                  'right'
              ],
              'description': 'Horizontal alignment'
          },
          {
              'name': 'height',
              'type': 'number',
              'description': 'Height in %',
              'default': 100
          }
      ]
  },
  'jekyll-collection-item': {
      'name': 'Jekyll Collection Item',
      'description': 'Display one item of a collection.',
      'doc': 'https://github.com/silexlabs/Silex/wiki/Jekyll-components',
      'category': 'Jekyll Components',
      'tags': [
          'Jekyll',
          'text'
      ],
      'isPrivate': true,
      'baseElement': 'html',
      'faIconClass': 'fa-circle',
      'initialCssClass': null,
      'initialCss': {
          'background-color': 'transparent'
      },
      'props': [{
              'name': 'collectionName',
              'displayName': 'Collection name',
              'description': 'Name of the collection which contains your item',
              'expandable': false,
              'type': 'string',
              'default': 'sections'
          },
          {
              'name': 'fieldName',
              'displayName': 'Field Name',
              'description': 'Which field of the item to display',
              'expandable': false,
              'type': 'string',
              'default': 'content'
          },
          {
              'name': 'whereFilters',
              'displayName': 'Where Filters',
              'description': 'Filters to apply inorder to select the element you want to display in the collection',
              'expandable': true,
              'type': [{
                      'name': 'variable',
                      'displayName': 'Variable',
                      'description': 'Which object to test',
                      'className': 'half-width',
                      'type': [
                          '',
                          'site.',
                          'page.',
                          'paginator.'
                      ],
                      'default': 'page.'
                  },
                  {
                      'name': 'leftValue',
                      'displayName': 'Left value',
                      'className': 'half-width',
                      'type': 'string',
                      'description': 'The left value of the where clause',
                      'default': 'lang'
                  },
                  {
                      'name': 'rightValue',
                      'displayName': 'Right value',
                      'description': 'The right value of the where clause',
                      'type': 'string',
                      'default': 'lang'
                  }
              ],
              'default': [{
                  'fieldName': 'lang',
                  'value': 'lang'
              }]
          },
          {
              'name': 'formatFilters',
              'displayName': 'FormatFilters',
              'description': 'Apply formats to the item',
              'expandable': true,
              'type': [{
                      'name': 'filter',
                      'displayName': 'Filter',
                      'description': 'Filter to apply',
                      'type': [
                          'relative_url',
                          'absolute_url',
                          'date_to_xmlschema',
                          'date_to_rfc822',
                          'date_to_string',
                          'date_to_long_string',
                          'where_exp',
                          'group_by',
                          'group_by_exp',
                          'xml_escape',
                          'cgi_escape',
                          'uri_escape',
                          'number_of_words',
                          'array_to_sentence_string',
                          'markdownify',
                          'smartify',
                          'sassify',
                          'scssify',
                          'slugify',
                          'jsonify',
                          'normalize_whitespace',
                          'sort',
                          'sample',
                          'to_integer',
                          'push',
                          'pop',
                          'shift',
                          'unshift',
                          'inspect',
                          'abs',
                          'append',
                          'at_least',
                          'at_most',
                          'capitalize',
                          'ceil',
                          'compact',
                          'concat',
                          'date',
                          'default',
                          'divided_by',
                          'downcase',
                          'escape',
                          'escape_once',
                          'first',
                          'floor',
                          'join',
                          'last',
                          'lstrip',
                          'map',
                          'minus',
                          'modulo',
                          'newline_to_br',
                          'plus',
                          'prepend',
                          'remove',
                          'remove_first',
                          'replace',
                          'replace_first',
                          'reverse',
                          'round',
                          'rstrip',
                          'size',
                          'slice',
                          'sort',
                          'sort_natural',
                          'split',
                          'strip',
                          'strip_html',
                          'strip_newlines',
                          'times',
                          'truncate',
                          'truncatewords',
                          'uniq',
                          'upcase',
                          'url_decode',
                          'url_encode'
                      ],
                      'default': 'markdownify'
                  },
                  {
                      'name': 'params',
                      'displayName': 'Params',
                      'description': 'Parameters of this filter',
                      'type': 'string',
                      'default': ''
                  }
              ],
              'default': [{
                  'filter': 'markdownify',
                  'params': ''
              }]
          }
      ]
  },
  'json-box': {
      'name': 'JSON box',
      'description': 'This is an element which will load data and display it as HTML. ',
      'doc': null,
      'category': 'Dynamic list',
      'tags': [
          'ui',
          'ux',
          'website',
          'dynamic data'
      ],
      'isPrivate': true,
      'baseElement': 'html',
      'faIconClass': 'fa-list',
      'initialCss': {
          'min-height': '400px'
      },
      'dependencies': {
          'script': [{
              'src': '//ajax.aspnetcdn.com/ajax/jquery.templates/beta1/jquery.tmpl.min.js'
          }]
      },
      'props': [{
              'name': 'url',
              'type': 'string',
              'description': 'The URL to load.',
              'default': 'https://api.buttercms.com/v2/posts/?auth_token=2fd9b76559c990b18cab8843e24d7a57f4dc8ca6'
          },
          {
              'name': 'template',
              'type': 'string',
              'description': 'The template to use to display the content.',
              'default': '<h2>{{html title}}</h2><p>{{html body}}</p>'
          },
          {
              'name': 'jsonRoot',
              'type': 'string',
              'description': 'The JSON path to the array of data.',
              'default': 'data'
          },
          {
              'name': 'refreshInterval',
              'type': 'number',
              'description': 'The refresh interval in seconds (0 to disable).',
              'default': 10
          },
          {
              'name': 'autosize',
              'type': 'boolean',
              'description': 'Take the size of the content (otherwise display a scroll bar).',
              'default': false
          }
      ]
  },
  'map': {
      'name': 'Live Map',
      'description': 'Display a map in your website. Your users will be able to move the map, zoom in and out in order to locate where you are exactly',
      'doc': 'https://github.com/silexlabs/Silex/wiki/Live-map',
      'category': 'Utils',
      'tags': [
          'map',
          'contact',
          'geoloc'
      ],
      'isPrivate': false,
      'baseElement': 'html',
      'faIconClass': 'fa-map',
      'dependencies': {
          'script': [{
              'src': '/static/2.7/osm/ol.js',
              'data-silex-static': ''
          }]
      },
      'initialCssClass': 'silex-use-height-not-minheight silex-element-content-full-height',
      'initialCss': {
          'height': '400px',
          'width': '400px',
          'background-color': 'transparent'
      },
      'props': [{
              'name': 'url',
              'expandable': true,
              'type': 'string',
              'default': 'http://www.openstreetmap.org/#map=18/48.87378/2.29489&layers=C',
              'description': 'URL of the map on openstreetmap.org'
          },
          {
              'name': 'marker',
              'expandable': true,
              'type': 'file',
              'default': [{
                  'url': 'https://openlayers.org/en/v4.0.1/examples/data/icon.png'
              }],
              'description': 'Image to display at the center of the map (called a marker)'
          }
      ]
  },
  'share': {
      'name': 'Share Buttons',
      'description': 'Simple share buttons.',
      'doc': 'https://github.com/silexlabs/Silex/wiki/Share-bar-component',
      'category': 'Utils',
      'tags': [
          'ui',
          'ux',
          'website',
          'anim'
      ],
      'baseElement': 'html',
      'faIconClass': 'fa-share',
      'initialCss': {
          'width': '400px',
          'min-height': '50px',
          'background-color': 'transparent'
      },
      'props': [{
              'name': 'style',
              'type': [
                  'Flat Web Icon Set - Color',
                  'Flat Web Icon Set - Black',
                  'Flat Web Icon Set - Inverted',
                  'Simple Icons',
                  'Simple Icons - Black'
              ],
              'default': 'Flat Web Icon Set - Color'
          },
          {
              'name': 'url',
              'type': 'string',
              'default': 'http://yoursite.com'
          },
          {
              'name': 'title',
              'type': 'string',
              'default': 'Your site title'
          },
          {
              'name': 'networks',
              'expandable': true,
              'type': 'array',
              'default': [
                  'Facebook',
                  'Twitter',
                  'Google+',
                  'Tumblr',
                  'Pinterest',
                  'Pocket',
                  'Reddit',
                  'LinkedIn',
                  'WordPress',
                  'Pinboard',
                  'Email'
              ]
          },
          {
              'name': 'twitter',
              'type': 'string',
              'description': 'Your name on twitter',
              'default': 'silexlabs'
          },
          {
              'name': 'description',
              'expandable': true,
              'type': 'multiline',
              'default': 'Your site description'
          }
      ]
  },
  'skill-bars': {
      'name': 'Skill bars',
      'description': 'Represent a set of skills as progress bars.',
      'doc': 'https://github.com/silexlabs/Silex/wiki/Skill-bar-component',
      'category': 'Utils',
      'tags': [
          'skill',
          'progress',
          'bar'
      ],
      'isPrivate': false,
      'baseElement': 'html',
      'faIconClass': 'fa-tasks',
      'initialCss': {
          'min-height': '100px',
          'width': '400px',
          'background-color': 'transparent'
      },
      'props': [{
              'name': 'bars',
              'expandable': true,
              'description': 'Bars and labels',
              'type': [{
                      'name': 'label',
                      'type': 'string',
                      'description': 'Label of the bar',
                      'default': 'Skill #1'
                  },
                  {
                      'name': 'percentage',
                      'type': 'number',
                      'description': 'Filled percentage of the bar',
                      'default': 50
                  },
                  {
                      'name': 'value',
                      'type': 'string',
                      'description': 'Value written in the bar',
                      'default': 'Good'
                  },
                  {
                      'name': 'background',
                      'type': 'color',
                      'description': 'Background of the bar',
                      'default': '#6adcfa'
                  },
                  {
                      'name': 'backgroundImage',
                      'type': 'file',
                      'description': 'Background image of the bar'
                  },
                  {
                      'name': 'labelColor',
                      'type': 'color',
                      'description': 'Background of the label',
                      'default': '#6adcfa'
                  }
              ]
          },
          {
              'name': 'speed',
              'expandable': true,
              'description': 'Time of the animation',
              'type': 'number',
              'default': 6000
          },
          {
              'name': 'delay',
              'expandable': true,
              'description': 'Delay before the animation',
              'type': 'number',
              'default': 500
          },
          {
              'name': 'labelSize',
              'expandable': true,
              'description': 'Width of the label in percentage of the bar',
              'type': 'number',
              'default': 25
          },
          {
              'name': 'barHeight',
              'expandable': true,
              'description': 'Height of the bars in pixels',
              'type': 'number',
              'default': 35
          }
      ]
  },
  'slideshow': {
      'name': 'Slideshow',
      'description': 'Display a series of texts and images.',
      'doc': 'https://github.com/silexlabs/Silex/wiki/Slideshow-component',
      'category': 'Utils',
      'tags': [
          'form',
          'input',
          'dropdown',
          'text'
      ],
      'isPrivate': false,
      'baseElement': 'html',
      'faIconClass': 'fa-slideshare',
      'dependencies': {
          'script': [{
              'src': '/static/2.7/unslider/unslider-min.js',
              'data-silex-static': ''
          }],
          'link': [{
              'rel': 'stylesheet',
              'href': '/static/2.7/unslider/unslider.css',
              'data-silex-static': ''
          }]
      },
      'initialCssClass': 'silex-use-height-not-minheight',
      'initialCss': {
          'height': '400px',
          'width': '400px',
          'background-color': 'transparent'
      },
      'props': [{
              'name': 'slides',
              'expandable': true,
              'type': [{
                      'name': 'image',
                      'type': 'file',
                      'description': 'image of the slide'
                  },
                  {
                      'name': 'text',
                      'type': 'multiline',
                      'description': 'text to display in the slide'
                  },
                  {
                      'name': 'bgColor',
                      'type': 'color',
                      'description': 'the slide\'s background color'
                  },
                  {
                      'name': 'color',
                      'type': 'color',
                      'description': 'color of the text'
                  },
                  {
                      'name': 'link',
                      'type': 'string',
                      'description': 'Link to open when the user clicks on the slide'
                  }
              ]
          },
          {
              'name': 'animation',
              'expandable': true,
              'default': 'horizontal',
              'description': 'How should Unslider animate each slide? Right now, there\'s three different animation types',
              'type': [
                  'horizontal',
                  'vertical',
                  'fade'
              ]
          },
          {
              'name': 'captionColor',
              'expandable': true,
              'type': 'color',
              'description': 'the captions text color',
              'default': 'white'
          },
          {
              'name': 'captionBgColor',
              'expandable': true,
              'type': 'color',
              'description': 'the captions background color',
              'default': 'rgba(0,0,0,0.5)'
          },
          {
              'name': 'captionAlignH',
              'expandable': true,
              'type': [
                  'left',
                  'center',
                  'right'
              ],
              'description': 'the captions horizontal position',
              'default': 'center'
          },
          {
              'name': 'captionAlignV',
              'expandable': true,
              'type': [
                  'top',
                  'center',
                  'bottom'
              ],
              'description': 'the captions vertical position',
              'default': 'bottom'
          },
          {
              'name': 'autoplay',
              'expandable': true,
              'type': 'boolean',
              'default': false,
              'description': 'Should the slider move by itself or only be triggered manually?'
          },
          {
              'name': 'speed',
              'expandable': true,
              'type': 'number',
              'default': 750,
              'description': 'How fast (in milliseconds) Unslider should animate between slides.'
          },
          {
              'name': 'delay',
              'expandable': true,
              'type': 'number',
              'default': 3000,
              'description': 'If autoplay is set to true, how many milliseconds should pass between moving the slides?'
          },
          {
              'name': 'index',
              'expandable': true,
              'type': 'number',
              'default': 0,
              'description': 'If this is set to an integer, \'first\' or \'last\', it\'ll set the default slide to that position rather than the first slide.'
          },
          {
              'name': 'nav',
              'expandable': true,
              'type': 'boolean',
              'default': true,
              'description': 'Do you want to generate an automatic clickable navigation for each slide in your slider?'
          },
          {
              'name': 'arrows',
              'expandable': true,
              'type': 'boolean',
              'default': true,
              'description': 'Do you want to add left/right arrows to your slider?'
          },
          {
              'name': 'onchange',
              'expandable': true,
              'type': 'action',
              'description': 'Fires the moment when the slide changes'
          }
      ]
  },
  'template': {
      'name': 'Generic content',
      'description': 'Add your content as a demo text and a liquid template',
      'doc': 'https://jekyllrb.com/docs/liquid/',
      'category': 'Templating',
      'faIconClass': 'fa-code',
      'baseElement': 'text',
      'props': [{
              'name': 'preview',
              'displayName': 'Preview content',
              'type': 'action',
              'description': 'HTML used for preview',
              'default': '<h1>This content</h1><p>This content will be replaced by your the one from a CMS</p>\n'
          },
          {
              'name': 'template',
              'displayName': 'Template',
              'type': 'action',
              'description': 'Template which will replace your content when you publish the website.',
              'default': '{{ content }}'
          }
      ]
  }
}
