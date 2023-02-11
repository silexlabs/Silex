"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
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
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50c1YyLjUuNjAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvdHMvc2VydmVyL3V0aWxzL2NvbXBvbmVudHNWMi41LjYwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsa0JBQWU7SUFDYixtQkFBbUIsRUFBRTtRQUNqQixNQUFNLEVBQUUseUJBQXlCO1FBQ2pDLGFBQWEsRUFBRSx5SUFBeUk7UUFDeEosS0FBSyxFQUFFLElBQUk7UUFDWCxVQUFVLEVBQUUsa0JBQWtCO1FBQzlCLE1BQU0sRUFBRTtZQUNKLElBQUk7WUFDSixJQUFJO1lBQ0osU0FBUztTQUNaO1FBQ0QsV0FBVyxFQUFFLElBQUk7UUFDakIsYUFBYSxFQUFFLFdBQVc7UUFDMUIsYUFBYSxFQUFFLGdCQUFnQjtRQUMvQixPQUFPLEVBQUUsQ0FBQztnQkFDRixNQUFNLEVBQUUsVUFBVTtnQkFDbEIsTUFBTSxFQUFFO29CQUNKLE1BQU07b0JBQ04sS0FBSztvQkFDTCxRQUFRO29CQUNSLFFBQVE7b0JBQ1IsYUFBYTtpQkFDaEI7Z0JBQ0QsU0FBUyxFQUFFLE1BQU07Z0JBQ2pCLGFBQWEsRUFBRSx3Q0FBd0M7YUFDMUQ7WUFDRDtnQkFDSSxNQUFNLEVBQUUsWUFBWTtnQkFDcEIsTUFBTSxFQUFFO29CQUNKLE1BQU07b0JBQ04sTUFBTTtvQkFDTixRQUFRO29CQUNSLE9BQU87b0JBQ1AsWUFBWTtpQkFDZjtnQkFDRCxTQUFTLEVBQUUsTUFBTTtnQkFDakIsYUFBYSxFQUFFLDBDQUEwQzthQUM1RDtZQUNEO2dCQUNJLE1BQU0sRUFBRSxPQUFPO2dCQUNmLE1BQU0sRUFBRSxTQUFTO2dCQUNqQixTQUFTLEVBQUUsS0FBSztnQkFDaEIsYUFBYSxFQUFFLDZEQUE2RDthQUMvRTtZQUNEO2dCQUNJLE1BQU0sRUFBRSxPQUFPO2dCQUNmLE1BQU0sRUFBRSxTQUFTO2dCQUNqQixTQUFTLEVBQUUsS0FBSztnQkFDaEIsYUFBYSxFQUFFLDZDQUE2QzthQUMvRDtTQUNKO0tBQ0o7SUFDRCxvQkFBb0IsRUFBRTtRQUNsQixNQUFNLEVBQUUsb0JBQW9CO1FBQzVCLGFBQWEsRUFBRSx5RUFBeUU7UUFDeEYsS0FBSyxFQUFFLElBQUk7UUFDWCxVQUFVLEVBQUUsa0JBQWtCO1FBQzlCLE1BQU0sRUFBRTtZQUNKLElBQUk7WUFDSixJQUFJO1lBQ0osU0FBUztZQUNULE1BQU07U0FDVDtRQUNELFdBQVcsRUFBRSxJQUFJO1FBQ2pCLGNBQWMsRUFBRTtZQUNaLFFBQVEsRUFBRSxDQUFDO29CQUNQLEtBQUssRUFBRSx5REFBeUQ7aUJBQ25FLENBQUM7U0FDTDtRQUNELGFBQWEsRUFBRSxXQUFXO1FBQzFCLGFBQWEsRUFBRSxXQUFXO1FBQzFCLE9BQU8sRUFBRSxDQUFDO2dCQUNGLE1BQU0sRUFBRSxRQUFRO2dCQUNoQixNQUFNLEVBQUU7b0JBQ0osTUFBTTtvQkFDTixPQUFPO29CQUNQLEtBQUs7b0JBQ0wsUUFBUTtpQkFDWDtnQkFDRCxTQUFTLEVBQUUsTUFBTTtnQkFDakIsYUFBYSxFQUFFLDBDQUEwQzthQUM1RDtZQUNEO2dCQUNJLE1BQU0sRUFBRSxVQUFVO2dCQUNsQixNQUFNLEVBQUUsUUFBUTtnQkFDaEIsU0FBUyxFQUFFLE1BQU07Z0JBQ2pCLGFBQWEsRUFBRSx5RUFBeUU7YUFDM0Y7WUFDRDtnQkFDSSxNQUFNLEVBQUUsVUFBVTtnQkFDbEIsTUFBTSxFQUFFLFFBQVE7Z0JBQ2hCLFNBQVMsRUFBRSxHQUFHO2dCQUNkLGFBQWEsRUFBRSwyQkFBMkI7YUFDN0M7WUFDRDtnQkFDSSxNQUFNLEVBQUUsT0FBTztnQkFDZixNQUFNLEVBQUUsUUFBUTtnQkFDaEIsU0FBUyxFQUFFLENBQUM7Z0JBQ1osYUFBYSxFQUFFLHdCQUF3QjthQUMxQztZQUNEO2dCQUNJLE1BQU0sRUFBRSxTQUFTO2dCQUNqQixNQUFNLEVBQUUsUUFBUTtnQkFDaEIsU0FBUyxFQUFFLENBQUM7Z0JBQ1osYUFBYSxFQUFFLDRGQUE0RjthQUM5RztZQUNEO2dCQUNJLE1BQU0sRUFBRSxTQUFTO2dCQUNqQixNQUFNLEVBQUUsUUFBUTtnQkFDaEIsU0FBUyxFQUFFLENBQUM7Z0JBQ1osYUFBYSxFQUFFLDRGQUE0RjthQUM5RztZQUNEO2dCQUNJLE1BQU0sRUFBRSxTQUFTO2dCQUNqQixNQUFNLEVBQUUsUUFBUTtnQkFDaEIsU0FBUyxFQUFFLENBQUM7Z0JBQ1osYUFBYSxFQUFFLDRGQUE0RjthQUM5RztZQUNEO2dCQUNJLE1BQU0sRUFBRSxTQUFTO2dCQUNqQixNQUFNLEVBQUUsUUFBUTtnQkFDaEIsU0FBUyxFQUFFLENBQUM7Z0JBQ1osYUFBYSxFQUFFLHVFQUF1RTthQUN6RjtZQUNEO2dCQUNJLE1BQU0sRUFBRSxPQUFPO2dCQUNmLE1BQU0sRUFBRSxRQUFRO2dCQUNoQixTQUFTLEVBQUUsR0FBRztnQkFDZCxhQUFhLEVBQUUsNERBQTREO2FBQzlFO1lBQ0Q7Z0JBQ0ksTUFBTSxFQUFFLFFBQVE7Z0JBQ2hCLE1BQU0sRUFBRTtvQkFDSixRQUFRO29CQUNSLE1BQU07b0JBQ04sU0FBUztvQkFDVCxhQUFhO29CQUNiLFVBQVU7aUJBQ2I7Z0JBQ0QsU0FBUyxFQUFFLFFBQVE7Z0JBQ25CLGFBQWEsRUFBRSw4QkFBOEI7YUFDaEQ7WUFDRDtnQkFDSSxNQUFNLEVBQUUsT0FBTztnQkFDZixNQUFNLEVBQUUsU0FBUztnQkFDakIsU0FBUyxFQUFFLEtBQUs7Z0JBQ2hCLGFBQWEsRUFBRSw2RkFBNkY7YUFDL0c7WUFDRDtnQkFDSSxNQUFNLEVBQUUsY0FBYztnQkFDdEIsTUFBTSxFQUFFLFFBQVE7Z0JBQ2hCLGFBQWEsRUFBRSx3REFBd0Q7YUFDMUU7WUFDRDtnQkFDSSxNQUFNLEVBQUUsYUFBYTtnQkFDckIsTUFBTSxFQUFFLFFBQVE7Z0JBQ2hCLGFBQWEsRUFBRSx1REFBdUQ7YUFDekU7WUFDRDtnQkFDSSxNQUFNLEVBQUUsYUFBYTtnQkFDckIsTUFBTSxFQUFFLFFBQVE7Z0JBQ2hCLGFBQWEsRUFBRSx3REFBd0Q7YUFDMUU7WUFDRDtnQkFDSSxNQUFNLEVBQUUsWUFBWTtnQkFDcEIsTUFBTSxFQUFFLFFBQVE7Z0JBQ2hCLGFBQWEsRUFBRSx1REFBdUQ7YUFDekU7U0FDSjtLQUNKO0lBQ0Qsa0JBQWtCLEVBQUU7UUFDaEIsTUFBTSxFQUFFLGtCQUFrQjtRQUMxQixhQUFhLEVBQUUsc0VBQXNFO1FBQ3JGLEtBQUssRUFBRSxJQUFJO1FBQ1gsVUFBVSxFQUFFLGNBQWM7UUFDMUIsTUFBTSxFQUFFO1lBQ0osSUFBSTtZQUNKLElBQUk7WUFDSixTQUFTO1lBQ1QsY0FBYztTQUNqQjtRQUNELFdBQVcsRUFBRSxJQUFJO1FBQ2pCLGFBQWEsRUFBRSxTQUFTO1FBQ3hCLGFBQWEsRUFBRSxhQUFhO1FBQzVCLE9BQU8sRUFBRSxDQUFDO2dCQUNOLE1BQU0sRUFBRSxRQUFRO2dCQUNoQixNQUFNLEVBQUUsUUFBUTtnQkFDaEIsYUFBYSxFQUFFLDJDQUEyQztnQkFDMUQsU0FBUyxFQUFFLEVBQUU7YUFDaEIsQ0FBQztLQUNMO0lBQ0QsTUFBTSxFQUFFO1FBQ0osTUFBTSxFQUFFLGNBQWM7UUFDdEIsYUFBYSxFQUFFLCtEQUErRDtRQUM5RSxLQUFLLEVBQUUsZ0VBQWdFO1FBQ3ZFLFVBQVUsRUFBRSxPQUFPO1FBQ25CLE1BQU0sRUFBRTtZQUNKLElBQUk7WUFDSixJQUFJO1lBQ0osU0FBUztZQUNULE1BQU07WUFDTixTQUFTO1lBQ1QsT0FBTztTQUNWO1FBQ0QsV0FBVyxFQUFFLEtBQUs7UUFDbEIsYUFBYSxFQUFFLE1BQU07UUFDckIsYUFBYSxFQUFFLFdBQVc7UUFDMUIsaUJBQWlCLEVBQUUsa0VBQWtFO1FBQ3JGLFlBQVksRUFBRTtZQUNWLE9BQU8sRUFBRSxPQUFPO1lBQ2hCLFFBQVEsRUFBRSxPQUFPO1lBQ2pCLGtCQUFrQixFQUFFLGFBQWE7U0FDcEM7UUFDRCxPQUFPLEVBQUUsQ0FBQztnQkFDRixNQUFNLEVBQUUsUUFBUTtnQkFDaEIsWUFBWSxFQUFFLElBQUk7Z0JBQ2xCLE1BQU0sRUFBRSxRQUFRO2dCQUNoQixTQUFTLEVBQUUsZ0JBQWdCO2dCQUMzQixhQUFhLEVBQUUscUZBQXFGO2FBQ3ZHO1lBQ0Q7Z0JBQ0ksTUFBTSxFQUFFLG1CQUFtQjtnQkFDM0IsWUFBWSxFQUFFLElBQUk7Z0JBQ2xCLE1BQU0sRUFBRSxRQUFRO2dCQUNoQixTQUFTLEVBQUUsTUFBTTthQUNwQjtZQUNEO2dCQUNJLE1BQU0sRUFBRSxpQkFBaUI7Z0JBQ3pCLFlBQVksRUFBRSxJQUFJO2dCQUNsQixNQUFNLEVBQUUsT0FBTztnQkFDZixTQUFTLEVBQUUsU0FBUzthQUN2QjtZQUNEO2dCQUNJLE1BQU0sRUFBRSx1QkFBdUI7Z0JBQy9CLFlBQVksRUFBRSxJQUFJO2dCQUNsQixNQUFNLEVBQUUsT0FBTztnQkFDZixTQUFTLEVBQUUsU0FBUzthQUN2QjtZQUNEO2dCQUNJLE1BQU0sRUFBRSxtQkFBbUI7Z0JBQzNCLFlBQVksRUFBRSxJQUFJO2dCQUNsQixNQUFNLEVBQUUsT0FBTztnQkFDZixTQUFTLEVBQUUsU0FBUzthQUN2QjtZQUNEO2dCQUNJLE1BQU0sRUFBRSxnQkFBZ0I7Z0JBQ3hCLFlBQVksRUFBRSxJQUFJO2dCQUNsQixNQUFNLEVBQUUsT0FBTztnQkFDZixTQUFTLEVBQUUsU0FBUzthQUN2QjtZQUNEO2dCQUNJLE1BQU0sRUFBRSxRQUFRO2dCQUNoQixZQUFZLEVBQUUsSUFBSTtnQkFDbEIsTUFBTSxFQUFFLFNBQVM7Z0JBQ2pCLFNBQVMsRUFBRSxJQUFJO2FBQ2xCO1lBQ0Q7Z0JBQ0ksTUFBTSxFQUFFLFFBQVE7Z0JBQ2hCLFlBQVksRUFBRSxJQUFJO2dCQUNsQixNQUFNLEVBQUUsUUFBUTtnQkFDaEIsU0FBUyxFQUFFLE1BQU07YUFDcEI7WUFDRDtnQkFDSSxNQUFNLEVBQUUsY0FBYztnQkFDdEIsWUFBWSxFQUFFLElBQUk7Z0JBQ2xCLE1BQU0sRUFBRSxRQUFRO2dCQUNoQixTQUFTLEVBQUUsV0FBVzthQUN6QjtZQUNEO2dCQUNJLE1BQU0sRUFBRSxRQUFRO2dCQUNoQixZQUFZLEVBQUUsSUFBSTtnQkFDbEIsTUFBTSxFQUFFLFNBQVM7Z0JBQ2pCLFNBQVMsRUFBRSxJQUFJO2FBQ2xCO1lBQ0Q7Z0JBQ0ksTUFBTSxFQUFFLFFBQVE7Z0JBQ2hCLFlBQVksRUFBRSxJQUFJO2dCQUNsQixNQUFNLEVBQUUsUUFBUTtnQkFDaEIsU0FBUyxFQUFFLG1CQUFtQjthQUNqQztZQUNEO2dCQUNJLE1BQU0sRUFBRSxjQUFjO2dCQUN0QixZQUFZLEVBQUUsSUFBSTtnQkFDbEIsTUFBTSxFQUFFLFFBQVE7Z0JBQ2hCLFNBQVMsRUFBRSxnQkFBZ0I7YUFDOUI7WUFDRDtnQkFDSSxNQUFNLEVBQUUsUUFBUTtnQkFDaEIsWUFBWSxFQUFFLElBQUk7Z0JBQ2xCLE1BQU0sRUFBRSxTQUFTO2dCQUNqQixTQUFTLEVBQUUsSUFBSTthQUNsQjtZQUNEO2dCQUNJLE1BQU0sRUFBRSxRQUFRO2dCQUNoQixZQUFZLEVBQUUsSUFBSTtnQkFDbEIsTUFBTSxFQUFFLFFBQVE7Z0JBQ2hCLFNBQVMsRUFBRSxjQUFjO2FBQzVCO1lBQ0Q7Z0JBQ0ksTUFBTSxFQUFFLGNBQWM7Z0JBQ3RCLFlBQVksRUFBRSxJQUFJO2dCQUNsQixNQUFNLEVBQUUsUUFBUTtnQkFDaEIsU0FBUyxFQUFFLHNCQUFzQjthQUNwQztZQUNEO2dCQUNJLE1BQU0sRUFBRSxVQUFVO2dCQUNsQixZQUFZLEVBQUUsSUFBSTtnQkFDbEIsTUFBTSxFQUFFLFFBQVE7Z0JBQ2hCLGFBQWEsRUFBRSwyR0FBMkc7YUFDN0g7U0FDSjtLQUNKO0lBQ0QsWUFBWSxFQUFFO1FBQ1YsTUFBTSxFQUFFLFlBQVk7UUFDcEIsYUFBYSxFQUFFLDZEQUE2RDtRQUM1RSxLQUFLLEVBQUUsb0RBQW9EO1FBQzNELFVBQVUsRUFBRSxJQUFJO1FBQ2hCLE1BQU0sRUFBRTtZQUNKLFNBQVM7WUFDVCxJQUFJO1NBQ1A7UUFDRCxXQUFXLEVBQUUsSUFBSTtRQUNqQixhQUFhLEVBQUUsU0FBUztRQUN4QixpQkFBaUIsRUFBRSxvQkFBb0I7UUFDdkMsYUFBYSxFQUFFLGFBQWE7UUFDNUIsT0FBTyxFQUFFLEVBQUU7S0FDZDtJQUNELFdBQVcsRUFBRTtRQUNULE1BQU0sRUFBRSxnQkFBZ0I7UUFDeEIsYUFBYSxFQUFFLG9GQUFvRjtRQUNuRyxLQUFLLEVBQUUsd0RBQXdEO1FBQy9ELFVBQVUsRUFBRSxJQUFJO1FBQ2hCLE1BQU0sRUFBRTtZQUNKLE1BQU07WUFDTixJQUFJO1lBQ0osWUFBWTtZQUNaLEtBQUs7WUFDTCxZQUFZO1NBQ2Y7UUFDRCxXQUFXLEVBQUUsS0FBSztRQUNsQixhQUFhLEVBQUUsTUFBTTtRQUNyQixhQUFhLEVBQUUsU0FBUztRQUN4QixpQkFBaUIsRUFBRSx3Q0FBd0M7UUFDM0QsWUFBWSxFQUFFO1lBQ1YsWUFBWSxFQUFFLE1BQU07WUFDcEIsT0FBTyxFQUFFLE1BQU07WUFDZixrQkFBa0IsRUFBRSxhQUFhO1NBQ3BDO1FBQ0QsT0FBTyxFQUFFLENBQUM7Z0JBQ0YsTUFBTSxFQUFFLE9BQU87Z0JBQ2YsWUFBWSxFQUFFLEtBQUs7Z0JBQ25CLE1BQU0sRUFBRSxTQUFTO2dCQUNqQixXQUFXLEVBQUUsVUFBVTtnQkFDdkIsU0FBUyxFQUFFLEtBQUs7Z0JBQ2hCLGFBQWEsRUFBRSwrQ0FBK0M7YUFDakU7WUFDRDtnQkFDSSxNQUFNLEVBQUUsT0FBTztnQkFDZixZQUFZLEVBQUUsS0FBSztnQkFDbkIsTUFBTSxFQUFFO29CQUNKLE1BQU07b0JBQ04sWUFBWTtpQkFDZjtnQkFDRCxXQUFXLEVBQUUsVUFBVTtnQkFDdkIsU0FBUyxFQUFFLE1BQU07Z0JBQ2pCLGFBQWEsRUFBRSwrQ0FBK0M7YUFDakU7WUFDRDtnQkFDSSxNQUFNLEVBQUUseUJBQXlCO2dCQUNqQyxhQUFhLEVBQUUsY0FBYztnQkFDN0IsWUFBWSxFQUFFLEtBQUs7Z0JBQ25CLFdBQVcsRUFBRSxVQUFVO2dCQUN2QixNQUFNLEVBQUUsT0FBTztnQkFDZixTQUFTLEVBQUUsU0FBUztnQkFDcEIsYUFBYSxFQUFFLDBDQUEwQzthQUM1RDtZQUNEO2dCQUNJLE1BQU0sRUFBRSxxQkFBcUI7Z0JBQzdCLGFBQWEsRUFBRSxlQUFlO2dCQUM5QixZQUFZLEVBQUUsS0FBSztnQkFDbkIsV0FBVyxFQUFFLFVBQVU7Z0JBQ3ZCLE1BQU0sRUFBRSxPQUFPO2dCQUNmLFNBQVMsRUFBRSxTQUFTO2dCQUNwQixhQUFhLEVBQUUsNkNBQTZDO2FBQy9EO1lBQ0Q7Z0JBQ0ksTUFBTSxFQUFFLGtCQUFrQjtnQkFDMUIsYUFBYSxFQUFFLFVBQVU7Z0JBQ3pCLFlBQVksRUFBRSxLQUFLO2dCQUNuQixXQUFXLEVBQUUsVUFBVTtnQkFDdkIsTUFBTSxFQUFFLE9BQU87Z0JBQ2YsU0FBUyxFQUFFLFNBQVM7Z0JBQ3BCLGFBQWEsRUFBRSw4Q0FBOEM7YUFDaEU7WUFDRDtnQkFDSSxNQUFNLEVBQUUsT0FBTztnQkFDZixhQUFhLEVBQUUsWUFBWTtnQkFDM0IsU0FBUyxFQUFFLEVBQUU7Z0JBQ2IsYUFBYSxFQUFFLHFCQUFxQjtnQkFDcEMsTUFBTSxFQUFFLENBQUM7d0JBQ0QsTUFBTSxFQUFFLE1BQU07d0JBQ2QsV0FBVyxFQUFFLElBQUk7d0JBQ2pCLE1BQU0sRUFBRSxRQUFRO3dCQUNoQixhQUFhLEVBQUUsTUFBTTt3QkFDckIsYUFBYSxFQUFFLHNDQUFzQztxQkFDeEQ7b0JBQ0Q7d0JBQ0ksTUFBTSxFQUFFLFlBQVk7d0JBQ3BCLFdBQVcsRUFBRSxJQUFJO3dCQUNqQixhQUFhLEVBQUUsTUFBTTt3QkFDckIsTUFBTSxFQUFFLE1BQU07d0JBQ2QsYUFBYSxFQUFFLHFCQUFxQjtxQkFDdkM7aUJBQ0o7YUFDSjtTQUNKO0tBQ0o7SUFDRCxhQUFhLEVBQUU7UUFDWCxNQUFNLEVBQUUsa0JBQWtCO1FBQzFCLGFBQWEsRUFBRSx5SEFBeUg7UUFDeEksS0FBSyxFQUFFLDBDQUEwQztRQUNqRCxVQUFVLEVBQUUsY0FBYztRQUMxQixNQUFNLEVBQUU7WUFDSixJQUFJO1lBQ0osSUFBSTtZQUNKLFNBQVM7U0FDWjtRQUNELFdBQVcsRUFBRSxJQUFJO1FBQ2pCLGFBQWEsRUFBRSxXQUFXO1FBQzFCLGFBQWEsRUFBRSxtQkFBbUI7UUFDbEMsWUFBWSxFQUFFO1lBQ1Ysa0JBQWtCLEVBQUUsYUFBYTtTQUNwQztRQUNELGlCQUFpQixFQUFFLGFBQWE7UUFDaEMsT0FBTyxFQUFFLEVBQUU7S0FDZDtJQUNELG9CQUFvQixFQUFFO1FBQ2xCLE1BQU0sRUFBRSxhQUFhO1FBQ3JCLGFBQWEsRUFBRSx1S0FBdUs7UUFDdEwsS0FBSyxFQUFFLDBDQUEwQztRQUNqRCxVQUFVLEVBQUUsY0FBYztRQUMxQixNQUFNLEVBQUU7WUFDSixJQUFJO1lBQ0osSUFBSTtZQUNKLFNBQVM7U0FDWjtRQUNELFdBQVcsRUFBRSxJQUFJO1FBQ2pCLGFBQWEsRUFBRSxXQUFXO1FBQzFCLGFBQWEsRUFBRSxzQkFBc0I7UUFDckMsWUFBWSxFQUFFO1lBQ1Ysa0JBQWtCLEVBQUUsYUFBYTtTQUNwQztRQUNELGlCQUFpQixFQUFFLHlCQUF5QjtRQUM1QyxPQUFPLEVBQUUsRUFBRTtLQUNkO0lBQ0QsY0FBYyxFQUFFO1FBQ1osTUFBTSxFQUFFLGNBQWM7UUFDdEIsYUFBYSxFQUFFLHlLQUF5SztRQUN4TCxLQUFLLEVBQUUsMENBQTBDO1FBQ2pELFVBQVUsRUFBRSxjQUFjO1FBQzFCLE1BQU0sRUFBRTtZQUNKLElBQUk7WUFDSixJQUFJO1lBQ0osU0FBUztTQUNaO1FBQ0QsV0FBVyxFQUFFLElBQUk7UUFDakIsYUFBYSxFQUFFLFNBQVM7UUFDeEIsYUFBYSxFQUFFLFdBQVc7UUFDMUIsWUFBWSxFQUFFO1lBQ1YsWUFBWSxFQUFFLE9BQU87U0FDeEI7UUFDRCw0QkFBNEIsRUFBRTtZQUMxQixrQkFBa0IsRUFBRSxhQUFhO1NBQ3BDO1FBQ0QsT0FBTyxFQUFFLENBQUM7Z0JBQ0YsTUFBTSxFQUFFLE9BQU87Z0JBQ2YsTUFBTSxFQUFFLFFBQVE7Z0JBQ2hCLGFBQWEsRUFBRSxZQUFZO2dCQUMzQixTQUFTLEVBQUUsR0FBRzthQUNqQjtZQUNEO2dCQUNJLE1BQU0sRUFBRSxPQUFPO2dCQUNmLE1BQU0sRUFBRTtvQkFDSixNQUFNO29CQUNOLE9BQU87aUJBQ1Y7Z0JBQ0QsYUFBYSxFQUFFLHNCQUFzQjthQUN4QztZQUNEO2dCQUNJLE1BQU0sRUFBRSxRQUFRO2dCQUNoQixNQUFNLEVBQUUsUUFBUTtnQkFDaEIsYUFBYSxFQUFFLGFBQWE7Z0JBQzVCLFNBQVMsRUFBRSxHQUFHO2FBQ2pCO1NBQ0o7S0FDSjtJQUNELHdCQUF3QixFQUFFO1FBQ3RCLE1BQU0sRUFBRSx3QkFBd0I7UUFDaEMsYUFBYSxFQUFFLG1DQUFtQztRQUNsRCxLQUFLLEVBQUUsMkRBQTJEO1FBQ2xFLFVBQVUsRUFBRSxtQkFBbUI7UUFDL0IsTUFBTSxFQUFFO1lBQ0osUUFBUTtZQUNSLE1BQU07U0FDVDtRQUNELFdBQVcsRUFBRSxJQUFJO1FBQ2pCLGFBQWEsRUFBRSxNQUFNO1FBQ3JCLGFBQWEsRUFBRSxXQUFXO1FBQzFCLGlCQUFpQixFQUFFLElBQUk7UUFDdkIsWUFBWSxFQUFFO1lBQ1Ysa0JBQWtCLEVBQUUsYUFBYTtTQUNwQztRQUNELE9BQU8sRUFBRSxDQUFDO2dCQUNGLE1BQU0sRUFBRSxnQkFBZ0I7Z0JBQ3hCLGFBQWEsRUFBRSxpQkFBaUI7Z0JBQ2hDLGFBQWEsRUFBRSxpREFBaUQ7Z0JBQ2hFLFlBQVksRUFBRSxLQUFLO2dCQUNuQixNQUFNLEVBQUUsUUFBUTtnQkFDaEIsU0FBUyxFQUFFLFVBQVU7YUFDeEI7WUFDRDtnQkFDSSxNQUFNLEVBQUUsV0FBVztnQkFDbkIsYUFBYSxFQUFFLFlBQVk7Z0JBQzNCLGFBQWEsRUFBRSxvQ0FBb0M7Z0JBQ25ELFlBQVksRUFBRSxLQUFLO2dCQUNuQixNQUFNLEVBQUUsUUFBUTtnQkFDaEIsU0FBUyxFQUFFLFNBQVM7YUFDdkI7WUFDRDtnQkFDSSxNQUFNLEVBQUUsY0FBYztnQkFDdEIsYUFBYSxFQUFFLGVBQWU7Z0JBQzlCLGFBQWEsRUFBRSxzRkFBc0Y7Z0JBQ3JHLFlBQVksRUFBRSxJQUFJO2dCQUNsQixNQUFNLEVBQUUsQ0FBQzt3QkFDRCxNQUFNLEVBQUUsVUFBVTt3QkFDbEIsYUFBYSxFQUFFLFVBQVU7d0JBQ3pCLGFBQWEsRUFBRSxzQkFBc0I7d0JBQ3JDLFdBQVcsRUFBRSxZQUFZO3dCQUN6QixNQUFNLEVBQUU7NEJBQ0osRUFBRTs0QkFDRixPQUFPOzRCQUNQLE9BQU87NEJBQ1AsWUFBWTt5QkFDZjt3QkFDRCxTQUFTLEVBQUUsT0FBTztxQkFDckI7b0JBQ0Q7d0JBQ0ksTUFBTSxFQUFFLFdBQVc7d0JBQ25CLGFBQWEsRUFBRSxZQUFZO3dCQUMzQixXQUFXLEVBQUUsWUFBWTt3QkFDekIsTUFBTSxFQUFFLFFBQVE7d0JBQ2hCLGFBQWEsRUFBRSxvQ0FBb0M7d0JBQ25ELFNBQVMsRUFBRSxNQUFNO3FCQUNwQjtvQkFDRDt3QkFDSSxNQUFNLEVBQUUsWUFBWTt3QkFDcEIsYUFBYSxFQUFFLGFBQWE7d0JBQzVCLGFBQWEsRUFBRSxxQ0FBcUM7d0JBQ3BELE1BQU0sRUFBRSxRQUFRO3dCQUNoQixTQUFTLEVBQUUsTUFBTTtxQkFDcEI7aUJBQ0o7Z0JBQ0QsU0FBUyxFQUFFLENBQUM7d0JBQ1IsV0FBVyxFQUFFLE1BQU07d0JBQ25CLE9BQU8sRUFBRSxNQUFNO3FCQUNsQixDQUFDO2FBQ0w7WUFDRDtnQkFDSSxNQUFNLEVBQUUsZUFBZTtnQkFDdkIsYUFBYSxFQUFFLGVBQWU7Z0JBQzlCLGFBQWEsRUFBRSwyQkFBMkI7Z0JBQzFDLFlBQVksRUFBRSxJQUFJO2dCQUNsQixNQUFNLEVBQUUsQ0FBQzt3QkFDRCxNQUFNLEVBQUUsUUFBUTt3QkFDaEIsYUFBYSxFQUFFLFFBQVE7d0JBQ3ZCLGFBQWEsRUFBRSxpQkFBaUI7d0JBQ2hDLE1BQU0sRUFBRTs0QkFDSixjQUFjOzRCQUNkLGNBQWM7NEJBQ2QsbUJBQW1COzRCQUNuQixnQkFBZ0I7NEJBQ2hCLGdCQUFnQjs0QkFDaEIscUJBQXFCOzRCQUNyQixXQUFXOzRCQUNYLFVBQVU7NEJBQ1YsY0FBYzs0QkFDZCxZQUFZOzRCQUNaLFlBQVk7NEJBQ1osWUFBWTs0QkFDWixpQkFBaUI7NEJBQ2pCLDBCQUEwQjs0QkFDMUIsYUFBYTs0QkFDYixVQUFVOzRCQUNWLFNBQVM7NEJBQ1QsU0FBUzs0QkFDVCxTQUFTOzRCQUNULFNBQVM7NEJBQ1Qsc0JBQXNCOzRCQUN0QixNQUFNOzRCQUNOLFFBQVE7NEJBQ1IsWUFBWTs0QkFDWixNQUFNOzRCQUNOLEtBQUs7NEJBQ0wsT0FBTzs0QkFDUCxTQUFTOzRCQUNULFNBQVM7NEJBQ1QsS0FBSzs0QkFDTCxRQUFROzRCQUNSLFVBQVU7NEJBQ1YsU0FBUzs0QkFDVCxZQUFZOzRCQUNaLE1BQU07NEJBQ04sU0FBUzs0QkFDVCxRQUFROzRCQUNSLE1BQU07NEJBQ04sU0FBUzs0QkFDVCxZQUFZOzRCQUNaLFVBQVU7NEJBQ1YsUUFBUTs0QkFDUixhQUFhOzRCQUNiLE9BQU87NEJBQ1AsT0FBTzs0QkFDUCxNQUFNOzRCQUNOLE1BQU07NEJBQ04sUUFBUTs0QkFDUixLQUFLOzRCQUNMLE9BQU87NEJBQ1AsUUFBUTs0QkFDUixlQUFlOzRCQUNmLE1BQU07NEJBQ04sU0FBUzs0QkFDVCxRQUFROzRCQUNSLGNBQWM7NEJBQ2QsU0FBUzs0QkFDVCxlQUFlOzRCQUNmLFNBQVM7NEJBQ1QsT0FBTzs0QkFDUCxRQUFROzRCQUNSLE1BQU07NEJBQ04sT0FBTzs0QkFDUCxNQUFNOzRCQUNOLGNBQWM7NEJBQ2QsT0FBTzs0QkFDUCxPQUFPOzRCQUNQLFlBQVk7NEJBQ1osZ0JBQWdCOzRCQUNoQixPQUFPOzRCQUNQLFVBQVU7NEJBQ1YsZUFBZTs0QkFDZixNQUFNOzRCQUNOLFFBQVE7NEJBQ1IsWUFBWTs0QkFDWixZQUFZO3lCQUNmO3dCQUNELFNBQVMsRUFBRSxhQUFhO3FCQUMzQjtvQkFDRDt3QkFDSSxNQUFNLEVBQUUsUUFBUTt3QkFDaEIsYUFBYSxFQUFFLFFBQVE7d0JBQ3ZCLGFBQWEsRUFBRSwyQkFBMkI7d0JBQzFDLE1BQU0sRUFBRSxRQUFRO3dCQUNoQixTQUFTLEVBQUUsRUFBRTtxQkFDaEI7aUJBQ0o7Z0JBQ0QsU0FBUyxFQUFFLENBQUM7d0JBQ1IsUUFBUSxFQUFFLGFBQWE7d0JBQ3ZCLFFBQVEsRUFBRSxFQUFFO3FCQUNmLENBQUM7YUFDTDtTQUNKO0tBQ0o7SUFDRCxVQUFVLEVBQUU7UUFDUixNQUFNLEVBQUUsVUFBVTtRQUNsQixhQUFhLEVBQUUsa0VBQWtFO1FBQ2pGLEtBQUssRUFBRSxJQUFJO1FBQ1gsVUFBVSxFQUFFLGNBQWM7UUFDMUIsTUFBTSxFQUFFO1lBQ0osSUFBSTtZQUNKLElBQUk7WUFDSixTQUFTO1lBQ1QsY0FBYztTQUNqQjtRQUNELFdBQVcsRUFBRSxJQUFJO1FBQ2pCLGFBQWEsRUFBRSxNQUFNO1FBQ3JCLGFBQWEsRUFBRSxTQUFTO1FBQ3hCLFlBQVksRUFBRTtZQUNWLFlBQVksRUFBRSxPQUFPO1NBQ3hCO1FBQ0QsY0FBYyxFQUFFO1lBQ1osUUFBUSxFQUFFLENBQUM7b0JBQ1AsS0FBSyxFQUFFLHFFQUFxRTtpQkFDL0UsQ0FBQztTQUNMO1FBQ0QsT0FBTyxFQUFFLENBQUM7Z0JBQ0YsTUFBTSxFQUFFLEtBQUs7Z0JBQ2IsTUFBTSxFQUFFLFFBQVE7Z0JBQ2hCLGFBQWEsRUFBRSxrQkFBa0I7Z0JBQ2pDLFNBQVMsRUFBRSx5RkFBeUY7YUFDdkc7WUFDRDtnQkFDSSxNQUFNLEVBQUUsVUFBVTtnQkFDbEIsTUFBTSxFQUFFLFFBQVE7Z0JBQ2hCLGFBQWEsRUFBRSw2Q0FBNkM7Z0JBQzVELFNBQVMsRUFBRSw2Q0FBNkM7YUFDM0Q7WUFDRDtnQkFDSSxNQUFNLEVBQUUsVUFBVTtnQkFDbEIsTUFBTSxFQUFFLFFBQVE7Z0JBQ2hCLGFBQWEsRUFBRSxxQ0FBcUM7Z0JBQ3BELFNBQVMsRUFBRSxNQUFNO2FBQ3BCO1lBQ0Q7Z0JBQ0ksTUFBTSxFQUFFLGlCQUFpQjtnQkFDekIsTUFBTSxFQUFFLFFBQVE7Z0JBQ2hCLGFBQWEsRUFBRSxpREFBaUQ7Z0JBQ2hFLFNBQVMsRUFBRSxFQUFFO2FBQ2hCO1lBQ0Q7Z0JBQ0ksTUFBTSxFQUFFLFVBQVU7Z0JBQ2xCLE1BQU0sRUFBRSxTQUFTO2dCQUNqQixhQUFhLEVBQUUsZ0VBQWdFO2dCQUMvRSxTQUFTLEVBQUUsS0FBSzthQUNuQjtTQUNKO0tBQ0o7SUFDRCxLQUFLLEVBQUU7UUFDSCxNQUFNLEVBQUUsVUFBVTtRQUNsQixhQUFhLEVBQUUsa0lBQWtJO1FBQ2pKLEtBQUssRUFBRSxrREFBa0Q7UUFDekQsVUFBVSxFQUFFLE9BQU87UUFDbkIsTUFBTSxFQUFFO1lBQ0osS0FBSztZQUNMLFNBQVM7WUFDVCxRQUFRO1NBQ1g7UUFDRCxXQUFXLEVBQUUsS0FBSztRQUNsQixhQUFhLEVBQUUsTUFBTTtRQUNyQixhQUFhLEVBQUUsUUFBUTtRQUN2QixjQUFjLEVBQUU7WUFDWixRQUFRLEVBQUUsQ0FBQztvQkFDUCxLQUFLLEVBQUUsdUJBQXVCO29CQUM5QixtQkFBbUIsRUFBRSxFQUFFO2lCQUMxQixDQUFDO1NBQ0w7UUFDRCxpQkFBaUIsRUFBRSxrRUFBa0U7UUFDckYsWUFBWSxFQUFFO1lBQ1YsUUFBUSxFQUFFLE9BQU87WUFDakIsT0FBTyxFQUFFLE9BQU87WUFDaEIsa0JBQWtCLEVBQUUsYUFBYTtTQUNwQztRQUNELE9BQU8sRUFBRSxDQUFDO2dCQUNGLE1BQU0sRUFBRSxLQUFLO2dCQUNiLFlBQVksRUFBRSxJQUFJO2dCQUNsQixNQUFNLEVBQUUsUUFBUTtnQkFDaEIsU0FBUyxFQUFFLGdFQUFnRTtnQkFDM0UsYUFBYSxFQUFFLHFDQUFxQzthQUN2RDtZQUNEO2dCQUNJLE1BQU0sRUFBRSxRQUFRO2dCQUNoQixZQUFZLEVBQUUsSUFBSTtnQkFDbEIsTUFBTSxFQUFFLE1BQU07Z0JBQ2QsU0FBUyxFQUFFLENBQUM7d0JBQ1IsS0FBSyxFQUFFLHlEQUF5RDtxQkFDbkUsQ0FBQztnQkFDRixhQUFhLEVBQUUsNkRBQTZEO2FBQy9FO1NBQ0o7S0FDSjtJQUNELE9BQU8sRUFBRTtRQUNMLE1BQU0sRUFBRSxlQUFlO1FBQ3ZCLGFBQWEsRUFBRSx1QkFBdUI7UUFDdEMsS0FBSyxFQUFFLDZEQUE2RDtRQUNwRSxVQUFVLEVBQUUsT0FBTztRQUNuQixNQUFNLEVBQUU7WUFDSixJQUFJO1lBQ0osSUFBSTtZQUNKLFNBQVM7WUFDVCxNQUFNO1NBQ1Q7UUFDRCxhQUFhLEVBQUUsTUFBTTtRQUNyQixhQUFhLEVBQUUsVUFBVTtRQUN6QixZQUFZLEVBQUU7WUFDVixPQUFPLEVBQUUsT0FBTztZQUNoQixZQUFZLEVBQUUsTUFBTTtZQUNwQixrQkFBa0IsRUFBRSxhQUFhO1NBQ3BDO1FBQ0QsT0FBTyxFQUFFLENBQUM7Z0JBQ0YsTUFBTSxFQUFFLE9BQU87Z0JBQ2YsTUFBTSxFQUFFO29CQUNKLDJCQUEyQjtvQkFDM0IsMkJBQTJCO29CQUMzQiw4QkFBOEI7b0JBQzlCLGNBQWM7b0JBQ2Qsc0JBQXNCO2lCQUN6QjtnQkFDRCxTQUFTLEVBQUUsMkJBQTJCO2FBQ3pDO1lBQ0Q7Z0JBQ0ksTUFBTSxFQUFFLEtBQUs7Z0JBQ2IsTUFBTSxFQUFFLFFBQVE7Z0JBQ2hCLFNBQVMsRUFBRSxxQkFBcUI7YUFDbkM7WUFDRDtnQkFDSSxNQUFNLEVBQUUsT0FBTztnQkFDZixNQUFNLEVBQUUsUUFBUTtnQkFDaEIsU0FBUyxFQUFFLGlCQUFpQjthQUMvQjtZQUNEO2dCQUNJLE1BQU0sRUFBRSxVQUFVO2dCQUNsQixZQUFZLEVBQUUsSUFBSTtnQkFDbEIsTUFBTSxFQUFFLE9BQU87Z0JBQ2YsU0FBUyxFQUFFO29CQUNQLFVBQVU7b0JBQ1YsU0FBUztvQkFDVCxTQUFTO29CQUNULFFBQVE7b0JBQ1IsV0FBVztvQkFDWCxRQUFRO29CQUNSLFFBQVE7b0JBQ1IsVUFBVTtvQkFDVixXQUFXO29CQUNYLFVBQVU7b0JBQ1YsT0FBTztpQkFDVjthQUNKO1lBQ0Q7Z0JBQ0ksTUFBTSxFQUFFLFNBQVM7Z0JBQ2pCLE1BQU0sRUFBRSxRQUFRO2dCQUNoQixhQUFhLEVBQUUsc0JBQXNCO2dCQUNyQyxTQUFTLEVBQUUsV0FBVzthQUN6QjtZQUNEO2dCQUNJLE1BQU0sRUFBRSxhQUFhO2dCQUNyQixZQUFZLEVBQUUsSUFBSTtnQkFDbEIsTUFBTSxFQUFFLFdBQVc7Z0JBQ25CLFNBQVMsRUFBRSx1QkFBdUI7YUFDckM7U0FDSjtLQUNKO0lBQ0QsWUFBWSxFQUFFO1FBQ1YsTUFBTSxFQUFFLFlBQVk7UUFDcEIsYUFBYSxFQUFFLDZDQUE2QztRQUM1RCxLQUFLLEVBQUUsNkRBQTZEO1FBQ3BFLFVBQVUsRUFBRSxPQUFPO1FBQ25CLE1BQU0sRUFBRTtZQUNKLE9BQU87WUFDUCxVQUFVO1lBQ1YsS0FBSztTQUNSO1FBQ0QsV0FBVyxFQUFFLEtBQUs7UUFDbEIsYUFBYSxFQUFFLE1BQU07UUFDckIsYUFBYSxFQUFFLFVBQVU7UUFDekIsWUFBWSxFQUFFO1lBQ1YsWUFBWSxFQUFFLE9BQU87WUFDckIsT0FBTyxFQUFFLE9BQU87WUFDaEIsa0JBQWtCLEVBQUUsYUFBYTtTQUNwQztRQUNELE9BQU8sRUFBRSxDQUFDO2dCQUNGLE1BQU0sRUFBRSxNQUFNO2dCQUNkLFlBQVksRUFBRSxJQUFJO2dCQUNsQixhQUFhLEVBQUUsaUJBQWlCO2dCQUNoQyxNQUFNLEVBQUUsQ0FBQzt3QkFDRCxNQUFNLEVBQUUsT0FBTzt3QkFDZixNQUFNLEVBQUUsUUFBUTt3QkFDaEIsYUFBYSxFQUFFLGtCQUFrQjt3QkFDakMsU0FBUyxFQUFFLFVBQVU7cUJBQ3hCO29CQUNEO3dCQUNJLE1BQU0sRUFBRSxZQUFZO3dCQUNwQixNQUFNLEVBQUUsUUFBUTt3QkFDaEIsYUFBYSxFQUFFLDhCQUE4Qjt3QkFDN0MsU0FBUyxFQUFFLEVBQUU7cUJBQ2hCO29CQUNEO3dCQUNJLE1BQU0sRUFBRSxPQUFPO3dCQUNmLE1BQU0sRUFBRSxRQUFRO3dCQUNoQixhQUFhLEVBQUUsMEJBQTBCO3dCQUN6QyxTQUFTLEVBQUUsTUFBTTtxQkFDcEI7b0JBQ0Q7d0JBQ0ksTUFBTSxFQUFFLFlBQVk7d0JBQ3BCLE1BQU0sRUFBRSxPQUFPO3dCQUNmLGFBQWEsRUFBRSx1QkFBdUI7d0JBQ3RDLFNBQVMsRUFBRSxTQUFTO3FCQUN2QjtvQkFDRDt3QkFDSSxNQUFNLEVBQUUsaUJBQWlCO3dCQUN6QixNQUFNLEVBQUUsTUFBTTt3QkFDZCxhQUFhLEVBQUUsNkJBQTZCO3FCQUMvQztvQkFDRDt3QkFDSSxNQUFNLEVBQUUsWUFBWTt3QkFDcEIsTUFBTSxFQUFFLE9BQU87d0JBQ2YsYUFBYSxFQUFFLHlCQUF5Qjt3QkFDeEMsU0FBUyxFQUFFLFNBQVM7cUJBQ3ZCO2lCQUNKO2FBQ0o7WUFDRDtnQkFDSSxNQUFNLEVBQUUsT0FBTztnQkFDZixZQUFZLEVBQUUsSUFBSTtnQkFDbEIsYUFBYSxFQUFFLHVCQUF1QjtnQkFDdEMsTUFBTSxFQUFFLFFBQVE7Z0JBQ2hCLFNBQVMsRUFBRSxJQUFJO2FBQ2xCO1lBQ0Q7Z0JBQ0ksTUFBTSxFQUFFLE9BQU87Z0JBQ2YsWUFBWSxFQUFFLElBQUk7Z0JBQ2xCLGFBQWEsRUFBRSw0QkFBNEI7Z0JBQzNDLE1BQU0sRUFBRSxRQUFRO2dCQUNoQixTQUFTLEVBQUUsR0FBRzthQUNqQjtZQUNEO2dCQUNJLE1BQU0sRUFBRSxXQUFXO2dCQUNuQixZQUFZLEVBQUUsSUFBSTtnQkFDbEIsYUFBYSxFQUFFLDZDQUE2QztnQkFDNUQsTUFBTSxFQUFFLFFBQVE7Z0JBQ2hCLFNBQVMsRUFBRSxFQUFFO2FBQ2hCO1lBQ0Q7Z0JBQ0ksTUFBTSxFQUFFLFdBQVc7Z0JBQ25CLFlBQVksRUFBRSxJQUFJO2dCQUNsQixhQUFhLEVBQUUsOEJBQThCO2dCQUM3QyxNQUFNLEVBQUUsUUFBUTtnQkFDaEIsU0FBUyxFQUFFLEVBQUU7YUFDaEI7U0FDSjtLQUNKO0lBQ0QsV0FBVyxFQUFFO1FBQ1QsTUFBTSxFQUFFLFdBQVc7UUFDbkIsYUFBYSxFQUFFLHVDQUF1QztRQUN0RCxLQUFLLEVBQUUsNkRBQTZEO1FBQ3BFLFVBQVUsRUFBRSxPQUFPO1FBQ25CLE1BQU0sRUFBRTtZQUNKLE1BQU07WUFDTixPQUFPO1lBQ1AsVUFBVTtZQUNWLE1BQU07U0FDVDtRQUNELFdBQVcsRUFBRSxLQUFLO1FBQ2xCLGFBQWEsRUFBRSxNQUFNO1FBQ3JCLGFBQWEsRUFBRSxlQUFlO1FBQzlCLGNBQWMsRUFBRTtZQUNaLFFBQVEsRUFBRSxDQUFDO29CQUNQLEtBQUssRUFBRSxzQ0FBc0M7b0JBQzdDLG1CQUFtQixFQUFFLEVBQUU7aUJBQzFCLENBQUM7WUFDRixNQUFNLEVBQUUsQ0FBQztvQkFDTCxLQUFLLEVBQUUsWUFBWTtvQkFDbkIsTUFBTSxFQUFFLG1DQUFtQztvQkFDM0MsbUJBQW1CLEVBQUUsRUFBRTtpQkFDMUIsQ0FBQztTQUNMO1FBQ0QsaUJBQWlCLEVBQUUsZ0NBQWdDO1FBQ25ELFlBQVksRUFBRTtZQUNWLFFBQVEsRUFBRSxPQUFPO1lBQ2pCLE9BQU8sRUFBRSxPQUFPO1lBQ2hCLGtCQUFrQixFQUFFLGFBQWE7U0FDcEM7UUFDRCxPQUFPLEVBQUUsQ0FBQztnQkFDRixNQUFNLEVBQUUsUUFBUTtnQkFDaEIsWUFBWSxFQUFFLElBQUk7Z0JBQ2xCLE1BQU0sRUFBRSxDQUFDO3dCQUNELE1BQU0sRUFBRSxPQUFPO3dCQUNmLE1BQU0sRUFBRSxNQUFNO3dCQUNkLGFBQWEsRUFBRSxvQkFBb0I7cUJBQ3RDO29CQUNEO3dCQUNJLE1BQU0sRUFBRSxNQUFNO3dCQUNkLE1BQU0sRUFBRSxXQUFXO3dCQUNuQixhQUFhLEVBQUUsOEJBQThCO3FCQUNoRDtvQkFDRDt3QkFDSSxNQUFNLEVBQUUsU0FBUzt3QkFDakIsTUFBTSxFQUFFLE9BQU87d0JBQ2YsYUFBYSxFQUFFLCtCQUErQjtxQkFDakQ7b0JBQ0Q7d0JBQ0ksTUFBTSxFQUFFLE9BQU87d0JBQ2YsTUFBTSxFQUFFLE9BQU87d0JBQ2YsYUFBYSxFQUFFLG1CQUFtQjtxQkFDckM7b0JBQ0Q7d0JBQ0ksTUFBTSxFQUFFLE1BQU07d0JBQ2QsTUFBTSxFQUFFLFFBQVE7d0JBQ2hCLGFBQWEsRUFBRSxnREFBZ0Q7cUJBQ2xFO2lCQUNKO2FBQ0o7WUFDRDtnQkFDSSxNQUFNLEVBQUUsV0FBVztnQkFDbkIsWUFBWSxFQUFFLElBQUk7Z0JBQ2xCLFNBQVMsRUFBRSxZQUFZO2dCQUN2QixhQUFhLEVBQUUsNkZBQTZGO2dCQUM1RyxNQUFNLEVBQUU7b0JBQ0osWUFBWTtvQkFDWixVQUFVO29CQUNWLE1BQU07aUJBQ1Q7YUFDSjtZQUNEO2dCQUNJLE1BQU0sRUFBRSxjQUFjO2dCQUN0QixZQUFZLEVBQUUsSUFBSTtnQkFDbEIsTUFBTSxFQUFFLE9BQU87Z0JBQ2YsYUFBYSxFQUFFLHlCQUF5QjtnQkFDeEMsU0FBUyxFQUFFLE9BQU87YUFDckI7WUFDRDtnQkFDSSxNQUFNLEVBQUUsZ0JBQWdCO2dCQUN4QixZQUFZLEVBQUUsSUFBSTtnQkFDbEIsTUFBTSxFQUFFLE9BQU87Z0JBQ2YsYUFBYSxFQUFFLCtCQUErQjtnQkFDOUMsU0FBUyxFQUFFLGlCQUFpQjthQUMvQjtZQUNEO2dCQUNJLE1BQU0sRUFBRSxlQUFlO2dCQUN2QixZQUFZLEVBQUUsSUFBSTtnQkFDbEIsTUFBTSxFQUFFO29CQUNKLE1BQU07b0JBQ04sUUFBUTtvQkFDUixPQUFPO2lCQUNWO2dCQUNELGFBQWEsRUFBRSxrQ0FBa0M7Z0JBQ2pELFNBQVMsRUFBRSxRQUFRO2FBQ3RCO1lBQ0Q7Z0JBQ0ksTUFBTSxFQUFFLGVBQWU7Z0JBQ3ZCLFlBQVksRUFBRSxJQUFJO2dCQUNsQixNQUFNLEVBQUU7b0JBQ0osS0FBSztvQkFDTCxRQUFRO29CQUNSLFFBQVE7aUJBQ1g7Z0JBQ0QsYUFBYSxFQUFFLGdDQUFnQztnQkFDL0MsU0FBUyxFQUFFLFFBQVE7YUFDdEI7WUFDRDtnQkFDSSxNQUFNLEVBQUUsVUFBVTtnQkFDbEIsWUFBWSxFQUFFLElBQUk7Z0JBQ2xCLE1BQU0sRUFBRSxTQUFTO2dCQUNqQixTQUFTLEVBQUUsS0FBSztnQkFDaEIsYUFBYSxFQUFFLGlFQUFpRTthQUNuRjtZQUNEO2dCQUNJLE1BQU0sRUFBRSxPQUFPO2dCQUNmLFlBQVksRUFBRSxJQUFJO2dCQUNsQixNQUFNLEVBQUUsUUFBUTtnQkFDaEIsU0FBUyxFQUFFLEdBQUc7Z0JBQ2QsYUFBYSxFQUFFLG9FQUFvRTthQUN0RjtZQUNEO2dCQUNJLE1BQU0sRUFBRSxPQUFPO2dCQUNmLFlBQVksRUFBRSxJQUFJO2dCQUNsQixNQUFNLEVBQUUsUUFBUTtnQkFDaEIsU0FBUyxFQUFFLElBQUk7Z0JBQ2YsYUFBYSxFQUFFLDBGQUEwRjthQUM1RztZQUNEO2dCQUNJLE1BQU0sRUFBRSxPQUFPO2dCQUNmLFlBQVksRUFBRSxJQUFJO2dCQUNsQixNQUFNLEVBQUUsUUFBUTtnQkFDaEIsU0FBUyxFQUFFLENBQUM7Z0JBQ1osYUFBYSxFQUFFLGlJQUFpSTthQUNuSjtZQUNEO2dCQUNJLE1BQU0sRUFBRSxLQUFLO2dCQUNiLFlBQVksRUFBRSxJQUFJO2dCQUNsQixNQUFNLEVBQUUsU0FBUztnQkFDakIsU0FBUyxFQUFFLElBQUk7Z0JBQ2YsYUFBYSxFQUFFLDBGQUEwRjthQUM1RztZQUNEO2dCQUNJLE1BQU0sRUFBRSxRQUFRO2dCQUNoQixZQUFZLEVBQUUsSUFBSTtnQkFDbEIsTUFBTSxFQUFFLFNBQVM7Z0JBQ2pCLFNBQVMsRUFBRSxJQUFJO2dCQUNmLGFBQWEsRUFBRSxzREFBc0Q7YUFDeEU7WUFDRDtnQkFDSSxNQUFNLEVBQUUsVUFBVTtnQkFDbEIsWUFBWSxFQUFFLElBQUk7Z0JBQ2xCLE1BQU0sRUFBRSxRQUFRO2dCQUNoQixhQUFhLEVBQUUseUNBQXlDO2FBQzNEO1NBQ0o7S0FDSjtJQUNELFVBQVUsRUFBRTtRQUNSLE1BQU0sRUFBRSxpQkFBaUI7UUFDekIsYUFBYSxFQUFFLHVEQUF1RDtRQUN0RSxLQUFLLEVBQUUsbUNBQW1DO1FBQzFDLFVBQVUsRUFBRSxZQUFZO1FBQ3hCLGFBQWEsRUFBRSxTQUFTO1FBQ3hCLGFBQWEsRUFBRSxNQUFNO1FBQ3JCLE9BQU8sRUFBRSxDQUFDO2dCQUNGLE1BQU0sRUFBRSxTQUFTO2dCQUNqQixhQUFhLEVBQUUsaUJBQWlCO2dCQUNoQyxNQUFNLEVBQUUsUUFBUTtnQkFDaEIsYUFBYSxFQUFFLHVCQUF1QjtnQkFDdEMsU0FBUyxFQUFFLHdGQUF3RjthQUN0RztZQUNEO2dCQUNJLE1BQU0sRUFBRSxVQUFVO2dCQUNsQixhQUFhLEVBQUUsVUFBVTtnQkFDekIsTUFBTSxFQUFFLFFBQVE7Z0JBQ2hCLGFBQWEsRUFBRSx3RUFBd0U7Z0JBQ3ZGLFNBQVMsRUFBRSxlQUFlO2FBQzdCO1NBQ0o7S0FDSjtDQUNGLENBQUEifQ==