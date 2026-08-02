export interface ToolFAQ {
  question: string
  answer: string
}

export interface HowToStep {
  name: string
  text: string
}

export interface ToolSEOConfig {
  name: string
  description: string
  category: string
  features: string[]
  faqs: ToolFAQ[]
  howToSteps: HowToStep[]
}

export const SEO_CONFIG = {
  site: {
    name: 'DEVYANTRA',
    url: 'https://devyantra.app',
    title: 'DEVYANTRA - Professional Developer Tools Collection',
    description: 'Free online developer tools for text comparison, JSON formatting, hash generation, Base64 encoding, JWT decoding, and more. Professional-grade web tools.',
    keywords: 'developer tools, online tools, json formatter, text compare, hash generator, base64, jwt decoder, timestamp converter',
    author: 'DEVYANTRA Development Team',
    language: 'en-US',
    type: 'website'
  },

  social: {
    twitter: {
      site: '@devyantra',
      creator: '@devyantra'
    },
    facebook: {
      appId: ''
    },
    linkedin: {
      company: 'devyantra'
    }
  },

  organization: {
    name: 'DEVYANTRA',
    url: 'https://devyantra.app',
    logo: 'https://devyantra.app/og-image.png',
    description: 'Professional developer tools collection offering free online utilities for text processing, encoding, hashing, and data manipulation.',
    email: 'contact@devyantra.app',
    sameAs: [
      // Add social media URLs when available
    ]
  },

  tools: {
    'text-compare': {
      name: 'Text Compare Online',
      description: 'Compare and format JSON, SQL, or text files online with intelligent diff highlighting.',
      category: 'Text Processing',
      features: ['Text comparison', 'JSON/SQL formatting', 'Side-by-side diff view', 'Syntax highlighting'],
      howToSteps: [
        { name: 'Enter original text', text: 'Paste or type your original text in the left panel.' },
        { name: 'Enter modified text', text: 'Paste or type the modified text in the right panel.' },
        { name: 'Review differences', text: 'Differences are highlighted automatically — green for additions, red for deletions.' },
        { name: 'Switch view mode', text: 'Use the toggle to switch between side-by-side and inline diff views.' }
      ],
      faqs: [
        {
          question: 'How do I compare two text files online?',
          answer: 'Paste or type your original text in the left panel and the modified text in the right panel. DevYantra instantly highlights additions, deletions, and modifications with color-coded diff markers. You can switch between side-by-side and inline views.'
        },
        {
          question: 'What is a diff tool?',
          answer: 'A diff tool compares two pieces of text and shows the differences between them. It highlights added lines in green, removed lines in red, and changed sections in yellow. Developers use diff tools to review code changes, compare configuration files, and track document revisions.'
        },
        {
          question: 'Can I compare JSON or SQL files?',
          answer: 'Yes. DevYantra automatically detects and formats JSON and SQL before comparing, so structural differences are clear. The tool also supports plain text, XML, and other formats.'
        }
      ]
    },
    'format-text': {
      name: 'JSON & SQL Formatter',
      description: 'Format and beautify JSON, SQL, XML, and other code online with syntax highlighting.',
      category: 'Code Formatting',
      features: ['Multi-language formatting', 'Syntax highlighting', 'Error detection', 'Minify/beautify'],
      howToSteps: [
        { name: 'Paste your code', text: 'Paste your code into the input area — the language is detected automatically.' },
        { name: 'Select format type', text: 'Select a different format type if auto-detection does not match.' },
        { name: 'Format or minify', text: 'Click the format button to beautify, or the minify button to compress.' },
        { name: 'Copy the result', text: 'Copy the result with the copy button or select and copy manually.' }
      ],
      faqs: [
        {
          question: 'How do I format JSON online?',
          answer: 'Paste your JSON into the input area and click the JSON format button. DevYantra will beautify it with proper indentation, validate the syntax, and highlight any errors. You can also minify JSON to reduce its size.'
        },
        {
          question: 'What is JSON beautification?',
          answer: 'JSON beautification (or pretty-printing) adds proper indentation and line breaks to compressed JSON, making it human-readable. This is useful for debugging API responses, editing configuration files, and reviewing data structures.'
        },
        {
          question: 'Which code languages can I format?',
          answer: 'DevYantra supports formatting for JSON, SQL, XML, CSS, and more. Each formatter handles language-specific syntax rules, indentation styles, and common formatting conventions.'
        }
      ]
    },
    'hash-generator': {
      name: 'Hash Generator',
      description: 'Generate secure cryptographic hashes with MD5, SHA1, SHA256, SHA512 algorithms.',
      category: 'Security',
      features: ['Multiple hash algorithms', 'Password hashing', 'Data integrity verification', 'Local processing'],
      howToSteps: [
        { name: 'Enter your text', text: 'Type or paste the text you want to hash into the input field.' },
        { name: 'View generated hashes', text: 'DevYantra instantly generates MD5, SHA-1, SHA-256, and SHA-512 hashes for your input.' },
        { name: 'Copy the hash', text: 'Click the copy button next to the hash you need to copy it to your clipboard.' }
      ],
      faqs: [
        {
          question: 'What is SHA-256?',
          answer: 'SHA-256 (Secure Hash Algorithm 256-bit) is a cryptographic hash function that produces a fixed 256-bit (32-byte) output for any input. It is widely used for data integrity verification, digital signatures, and blockchain technology. SHA-256 is considered secure and collision-resistant.'
        },
        {
          question: 'How do I generate an MD5 hash?',
          answer: 'Type or paste your text in the input field and DevYantra instantly generates the MD5 hash along with SHA-1, SHA-256, and SHA-512 hashes. All processing happens in your browser — your data never leaves your device.'
        },
        {
          question: 'Is it safe to generate hashes online?',
          answer: 'DevYantra processes all hashes locally in your browser using the Web Crypto API. Your data is never sent to any server, making it safe for sensitive information like passwords and API keys.'
        }
      ]
    },
    'base64-tools': {
      name: 'Base64 Encoder/Decoder',
      description: 'Encode and decode Base64 strings with support for text, URLs, and binary data.',
      category: 'Encoding',
      features: ['Base64 encoding/decoding', 'URL-safe Base64', 'Real-time conversion', 'Multi-format support'],
      howToSteps: [
        { name: 'Enter text or Base64', text: 'Paste plain text to encode, or a Base64 string to decode, into the input area.' },
        { name: 'Choose encode or decode', text: 'Select the Encode or Decode mode depending on the direction of conversion.' },
        { name: 'View and copy the result', text: 'The converted output appears instantly. Click the copy button to copy it to your clipboard.' }
      ],
      faqs: [
        {
          question: 'What is Base64 encoding?',
          answer: 'Base64 is a binary-to-text encoding scheme that represents binary data as an ASCII string. It is commonly used to embed images in HTML/CSS, transmit binary data in JSON APIs, encode email attachments, and store binary data in text-based formats.'
        },
        {
          question: 'How do I decode Base64?',
          answer: 'Paste your Base64-encoded string into the input field and DevYantra will instantly decode it to readable text. The tool handles standard Base64 and URL-safe Base64 variants automatically.'
        },
        {
          question: 'When should I use Base64 encoding?',
          answer: 'Use Base64 when you need to include binary data in text-only contexts, such as embedding images in data URIs, sending attachments via email (MIME), transmitting data in JSON or XML, or storing binary blobs in databases that only support text.'
        }
      ]
    },
    'jwt-decoder': {
      name: 'JWT Decoder',
      description: 'Decode and analyze JWT tokens with header, payload, and signature verification.',
      category: 'Authentication',
      features: ['JWT token decoding', 'Claims inspection', 'Expiration checking', 'Security analysis'],
      howToSteps: [
        { name: 'Paste the JWT', text: 'Paste the full JWT string (header.payload.signature) into the input field.' },
        { name: 'Review decoded sections', text: 'The header and payload are decoded and displayed automatically with syntax highlighting.' },
        { name: 'Check token details', text: 'Review expiration times, issued-at dates, and other claims highlighted in the decoded output.' }
      ],
      faqs: [
        {
          question: 'What is a JWT token?',
          answer: 'A JSON Web Token (JWT) is a compact, URL-safe token format used for securely transmitting information between parties. It consists of three parts: a header (algorithm and token type), a payload (claims like user ID and expiration), and a signature for verification.'
        },
        {
          question: 'How do I decode a JWT?',
          answer: 'Paste the full JWT string (including the dots) into the input field. DevYantra will instantly decode and display the header, payload, and signature sections. It also checks expiration times and highlights security-relevant claims.'
        },
        {
          question: 'Is it safe to decode JWTs online?',
          answer: 'DevYantra decodes JWTs entirely in your browser — the token is never sent to any server. This makes it safe for debugging authentication tokens from development and staging environments.'
        }
      ]
    },
    'timestamp-converter': {
      name: 'Timestamp Converter',
      description: 'Convert Unix timestamps to dates and vice versa with timezone support.',
      category: 'Date & Time',
      features: ['Unix timestamp conversion', 'Multiple timezone support', 'Various date formats', 'Real-time conversion'],
      howToSteps: [
        { name: 'Enter a timestamp or date', text: 'Type a Unix timestamp (seconds or milliseconds) or a human-readable date into the input field.' },
        { name: 'View the conversion', text: 'The converted result appears instantly in both human-readable and Unix timestamp formats.' },
        { name: 'Select timezone and format', text: 'Choose your preferred timezone and date format from the options to customize the output.' }
      ],
      faqs: [
        {
          question: 'How do I convert a Unix timestamp?',
          answer: 'Enter a Unix timestamp (seconds or milliseconds since January 1, 1970) into the input field and DevYantra will instantly convert it to a human-readable date and time in your local timezone and UTC.'
        },
        {
          question: 'What is epoch time?',
          answer: 'Epoch time (also called Unix time or POSIX time) counts the number of seconds elapsed since January 1, 1970, 00:00:00 UTC. It is the standard way computers store and compare dates internally and is widely used in APIs, databases, and log files.'
        },
        {
          question: 'Can I convert dates to timestamps?',
          answer: 'Yes. Enter a human-readable date and time and DevYantra will convert it to a Unix timestamp in both seconds and milliseconds. You can also get the current timestamp with one click.'
        }
      ]
    },
    'character-count': {
      name: 'Character Counter',
      description: 'Count characters, words, lines, and paragraphs with detailed text analytics.',
      category: 'Text Analysis',
      features: ['Character/word counting', 'Text analytics', 'Platform limits', 'Reading time estimation'],
      howToSteps: [
        { name: 'Enter your text', text: 'Paste or type your text into the input area.' },
        { name: 'View live statistics', text: 'Character count, word count, line count, and paragraph count update instantly as you type.' },
        { name: 'Check platform limits', text: 'Review the platform limit indicators to see if your text fits within Twitter, LinkedIn, or other character limits.' }
      ],
      faqs: [
        {
          question: 'How do I count characters in text?',
          answer: 'Paste or type your text into the input area and DevYantra instantly displays the character count, word count, line count, and paragraph count. It also shows reading time estimates and checks against common platform character limits.'
        },
        {
          question: 'What is a word counter?',
          answer: 'A word counter is a tool that counts the number of words in a piece of text. It typically also provides character counts, sentence counts, and reading time estimates. Writers use word counters for meeting article length requirements, social media post limits, and academic paper constraints.'
        },
        {
          question: 'Does it count characters with or without spaces?',
          answer: 'DevYantra shows both: total characters (with spaces) and characters without spaces. This is useful for platforms like Twitter/X that count all characters, and services that only count non-space characters.'
        }
      ]
    },
    'delimiter': {
      name: 'Delimiter Tool',
      description: 'Convert between delimited and newline-separated text formats with smart delimiter detection.',
      category: 'Text Processing',
      features: ['Delimiter conversion', 'Smart detection', 'Custom delimiters', 'Trim and filter options'],
      howToSteps: [
        { name: 'Enter delimited text', text: 'Paste your comma-separated, pipe-separated, or other delimited text into the left panel.' },
        { name: 'Select the delimiter', text: 'Choose the delimiter from the options or let DevYantra auto-detect it.' },
        { name: 'Convert and copy', text: 'Click Split to Lines or Join with Delimiter to convert. Copy the result from the output panel.' }
      ],
      faqs: [
        {
          question: 'How do I split comma-separated values into lines?',
          answer: 'Paste your comma-separated text into the left panel, select the comma delimiter (or let DevYantra auto-detect it), and click "Split to Lines". Each value will appear on its own line in the right panel.'
        },
        {
          question: 'Can I use custom delimiters?',
          answer: 'Yes. DevYantra supports comma, pipe, semicolon, colon, tab, and space as quick delimiters, plus a custom option where you can enter any character or string as the delimiter.'
        },
        {
          question: 'How do I join lines into a delimited string?',
          answer: 'Enter your text with one item per line in the right panel, choose your delimiter, and click "Join with Delimiter". The tool also offers options to trim whitespace and remove empty lines during conversion.'
        }
      ]
    },
    'regex-tester': {
      name: 'Regex Tester',
      description: 'Test regular expressions online with live match highlighting, named groups, and replace preview. ReDoS-safe: patterns run in a worker and can never freeze your browser.',
      category: 'Code Testing',
      features: [
        'Live match highlighting with a capture-group table',
        'Replace preview with $1 and $<name> support',
        'g/i/m/s/u/y flag toggles',
        'Curated common-pattern library (email, URL, UUID, and more)',
        'Worker-isolated execution that can never freeze the page'
      ],
      howToSteps: [
        { name: 'Enter a pattern', text: 'Type or paste a regular expression into the Pattern field — a syntax error is shown inline underneath it as you type.' },
        { name: 'Toggle flags', text: 'Check g, i, m, s, u, or y to control global matching, case-insensitivity, multiline anchors, dotall mode, unicode mode, and sticky matching.' },
        { name: 'Paste test text', text: 'Paste the text you want to match against into the Test string area.' },
        { name: 'Read matches or the replace preview', text: 'Matches highlight instantly with a details table below; switch on Replace mode to preview a $1 / $<name> substitution.' }
      ],
      faqs: [
        {
          question: 'Why did my pattern time out?',
          answer: 'Some patterns (for example, nested quantifiers like (a+)+) can cause catastrophic backtracking, where the regex engine tries an exponential number of ways to match and effectively never finishes. DevYantra runs every pattern in a dedicated Web Worker with a 2-second budget — if a pattern does not finish in time, the worker is terminated and a timeout message appears instead of a frozen tab. Editing the pattern runs it again immediately, and the tab stays responsive throughout.'
        },
        {
          question: 'Does my text leave the browser?',
          answer: 'No. The pattern and test string are evaluated entirely inside a Web Worker running in your own browser tab. Nothing is uploaded anywhere — this tool makes zero network requests.'
        },
        {
          question: 'Which regex dialect is this?',
          answer: 'DevYantra uses the native JavaScript RegExp engine built into your browser, including named capture groups and lookbehind assertions where supported. Behavior matches exactly what new RegExp() produces in your own browser, since that is exactly what runs under the hood.'
        }
      ]
    },

    'json-explorer': {
      name: 'JSON Explorer',
      description: 'Explore JSON as a collapsible tree with click-to-copy JSON paths, search, and structure stats. Free, private, and entirely in your browser.',
      category: 'Data Inspection',
      features: [
        'Collapsible tree with type badges for every value',
        'Click any key to copy its JSON path',
        'Search that expands and highlights matches',
        'Structure stats: keys, max depth, and size',
        '2 MB published limit, entirely synchronous and private'
      ],
      howToSteps: [
        { name: 'Paste JSON', text: 'Paste your JSON into the input field — it parses automatically a moment after you stop typing.' },
        { name: 'Expand nodes', text: 'Use the arrow next to each object or array to expand or collapse it. The top few levels are expanded by default.' },
        { name: 'Click a key to copy its path', text: 'Click any key in the tree to copy its full JSON path (for example $.users[1].name) to your clipboard.' },
        { name: 'Search to jump', text: 'Type in the search box to expand and highlight every key or string value that matches, case-insensitively.' }
      ],
      faqs: [
        {
          question: 'How do I get the path to a value?',
          answer: 'Click the key of any value in the tree. Its JSON path — for example $.users[1].name, or $["weird key"] when a property name is not a valid identifier — is copied to your clipboard immediately, with a toast confirming the copy. Hovering over a key also shows its path as a tooltip.'
        },
        {
          question: 'Why is there a 2 MB limit?',
          answer: 'Parsing and building the tree happens synchronously on the main thread so results feel instant — no spinner, no worker round-trip. Keeping that snappy requires a size limit; 2 MB comfortably covers real-world API responses and config files. Larger payloads are better explored in a dedicated editor.'
        },
        {
          question: 'Is my JSON uploaded anywhere?',
          answer: 'No. Parsing, path generation, and search all run locally in your browser tab. DevYantra makes zero network requests with your data.'
        }
      ]
    },

    'cron-parser': {
      name: 'Cron Parser',
      description: 'Parse cron expressions into plain English and preview the next 10 run times in local time and UTC. Supports ranges, steps, lists, and day names.',
      category: 'Date & Time',
      features: [
        'Plain-English description of any standard 5-field cron expression',
        'Next 10 run times, shown in both local time and UTC',
        'Per-field breakdown table (minute, hour, day of month, month, day of week)',
        'One-click presets for common schedules',
        'Full standard syntax: names, ranges, steps, and lists'
      ],
      howToSteps: [
        { name: 'Type or pick a preset', text: 'Type a standard 5-field cron expression, or choose one of the built-in presets to fill it in for you.' },
        { name: 'Read the description', text: 'A plain-English sentence explains exactly when the schedule runs.' },
        { name: 'Check the next runs', text: 'Review the next 10 run times in both your local timezone and UTC, plus a per-field breakdown of what each part of the expression resolved to.' }
      ],
      faqs: [
        {
          question: 'Why isn\'t my 6-field expression accepted?',
          answer: 'DevYantra parses the standard 5-field cron format (minute, hour, day-of-month, month, day-of-week). Six- and seven-field variants that add a leading seconds field or a trailing year field are non-standard extensions used by some job schedulers, not the original cron format — they are rejected with a clear error rather than silently misinterpreted.'
        },
        {
          question: 'Which timezone are the run times in?',
          answer: 'The next-runs table shows every time in both your local timezone (whatever your system clock and browser are set to) and UTC, side by side. Daylight saving transitions follow your local system clock, exactly as a real cron daemon on that machine would observe them.'
        },
        {
          question: 'What does the day-of-month/day-of-week OR rule mean?',
          answer: 'When BOTH the day-of-month and day-of-week fields are restricted (neither is left as a bare *), classic cron matches a day when EITHER condition is true, not only when both are — this is the traditional vixie cron behavior. For example, "0 0 13 * FRI" runs at midnight on the 13th of every month AND on every Friday, not only on Fridays that happen to land on the 13th. If only one of the two fields is restricted, that field alone controls which days match.'
        }
      ]
    },

    'uuid-generator': {
      name: 'UUID & ULID Generator',
      description: 'Generate UUID v4, timestamp-ordered UUID v7, and ULIDs in bulk — and inspect any identifier to reveal its version, variant, and embedded timestamp.',
      category: 'Identifiers',
      features: [
        'Generate 1 to 100 identifiers at once',
        'UUID v4 (random), UUID v7 (timestamp-ordered), and ULID (Crockford Base32) support',
        'Inspect any identifier to extract its version, variant, and embedded timestamp',
        'Uppercase/lowercase toggle for generated output',
        'One-click copy of the entire batch'
      ],
      howToSteps: [
        { name: 'Pick a kind', text: 'Choose UUID v4 (fully random), UUID v7 (timestamp-ordered), or ULID (Crockford Base32).' },
        { name: 'Set a count', text: 'Choose how many identifiers to generate at once, from 1 to 100.' },
        { name: 'Generate', text: 'Click Generate to produce the list.' },
        { name: 'Copy or inspect', text: 'Copy the entire batch with one click, or paste any single identifier into the inspector to decode its version, variant, and timestamp.' }
      ],
      faqs: [
        {
          question: 'What\'s the difference between UUID v4 and v7?',
          answer: 'UUID v4 is fully random (122 random bits) with no inherent ordering — two v4 IDs generated seconds apart look completely unrelated. UUID v7 embeds a 48-bit millisecond timestamp in its most significant bits, so v7 IDs generated later always sort after ones generated earlier when compared as plain strings, which makes them better database primary keys (less index fragmentation) while still remaining globally unique.'
        },
        {
          question: 'What is a ULID?',
          answer: 'A ULID (Universally Unique Lexicographically Sortable Identifier) encodes a 48-bit millisecond timestamp and 80 bits of randomness as 26 Crockford Base32 characters, instead of UUID\'s 36-character hyphenated hex format. Like UUID v7, ULIDs sort chronologically as plain strings; unlike UUID, they have no dashes, exclude visually ambiguous letters (I, L, O, U), and are 10 characters shorter.'
        },
        {
          question: 'Are these IDs generated securely?',
          answer: 'Yes. Every random bit — the full 122 bits of a v4 UUID, the random suffix of a v7 UUID, and the 80-bit random component of a ULID — comes from crypto.getRandomValues(), the Web Crypto API\'s cryptographically secure random number generator, running locally in your browser. Nothing is sent to a server.'
        }
      ]
    },

    'url-parser': {
      name: 'URL Parser',
      description: 'Break any URL into scheme, host, path, and an editable query-parameter table that rebuilds the URL live. Encode or decode components instantly.',
      category: 'Encoding',
      features: [
        'Decompose any URL into scheme, host, port, path, hash, and query parameters',
        'Editable query-parameter grid that rebuilds the URL live as you type',
        'Full support for repeated keys (e.g. tag=a&tag=b) — order and duplicates preserved',
        'Encode or decode text with encodeURIComponent/decodeURIComponent',
        'Base-URL resolution for relative inputs (e.g. /path?x=1)',
        'International domain names shown in both punycode and unicode'
      ],
      howToSteps: [
        { name: 'Paste a URL', text: 'Paste a URL into the field — if it is relative, a base-URL field appears so it can be resolved.' },
        { name: 'Read the parts', text: 'Scheme, host, port, path, and hash appear in a table below, with the unicode form shown alongside any punycode host.' },
        { name: 'Edit query parameters', text: 'Change a value, delete a row, or add a new one in the query-parameter table.' },
        { name: 'Copy the rebuilt URL', text: 'The rebuilt URL updates live as you edit; copy it with one click.' }
      ],
      faqs: [
        {
          question: 'Why did my + turn into %20?',
          answer: 'Both + and %20 mean a literal space inside a URL\'s query string — but + only means that by convention inside a query string, while %20 means it everywhere and can never be confused with a literal plus sign. The rebuilt URL always uses the unambiguous %20 form, even if the original URL you pasted used +.'
        },
        {
          question: 'Can I edit query parameters?',
          answer: 'Yes. Every key and value in the query-parameter table is editable — change a value, delete a row, or add a new one — and the rebuilt URL field below updates immediately to match, preserving repeated keys and their order.'
        },
        {
          question: 'Does this handle international domains?',
          answer: 'Yes. A host with non-ASCII characters (like bücher.example) is shown in both its punycode form (xn--bcher-kva.example, the form actually used on the wire) and its original unicode spelling, side by side.'
        }
      ]
    }
  } as Record<string, ToolSEOConfig>,

  structured: {
    breadcrumb: true,
    organization: true,
    website: true,
    tool: true,
    faq: true
  }
}

export const getToolSEO = (toolKey: string) => {
  const tool = SEO_CONFIG.tools[toolKey]
  if (!tool) return null

  return {
    title: `${tool.name} | ${SEO_CONFIG.site.name}`,
    description: tool.description,
    canonical: `/tools/${toolKey}`,
    type: 'website',
    tool,
    breadcrumb: [
      { name: 'Home', url: '/' },
      { name: tool.name, url: `/tools/${toolKey}` }
    ],
    faqs: tool.faqs,
    howToSteps: tool.howToSteps
  }
}
