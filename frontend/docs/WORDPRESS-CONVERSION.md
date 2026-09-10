# WordPress Conversion Guide

## Goal
Convert the standalone HTML + Tailwind + JavaScript frontend into a custom WordPress theme while keeping domain business logic outside the theme.

## Recommended Future Theme Structure

wp-content/themes/domain-platform/
├── style.css
├── functions.php
├── theme.json
├── front-page.php
├── page.php
├── header.php
├── footer.php
├── index.php
├── screenshot.png
├── template-parts/
│   ├── header/
│   ├── footer/
│   ├── hero/
│   ├── domain/
│   └── sections/
├── page-templates/
│   ├── domains.php
│   ├── pricing.php
│   ├── transfer-domain.php
│   ├── whois.php
│   └── support.php
└── assets/
    ├── css/
    ├── js/
    └── images/

## Page Mapping

| Standalone page | WordPress target |
|---|---|
| index.html | front-page.php |
| domains.html | page template / WordPress page |
| pricing.html | page template / WordPress page |
| transfer-domain.html | page template |
| whois.html | page template |
| support.html | page template |
| about.html | normal WordPress page |
| contact.html | normal WordPress page |
| faq.html | normal WordPress page |
| legal pages | normal WordPress pages |

## Important Rule

The theme should contain presentation only:
- HTML/templates
- CSS/Tailwind output
- JavaScript UI
- WordPress navigation
- Editable content presentation

A custom plugin should contain domain application logic:
- Registrar API communication
- API credentials
- Pricing engine
- Domain operations
- DNS operations
- Orders
- Integration logic

## Future Plugin Concept

wp-content/plugins/domain-platform-core/

This plugin can later expose safe endpoints such as:
- /wp-json/domain-platform/v1/search
- /wp-json/domain-platform/v1/pricing
- /wp-json/domain-platform/v1/cart
- /wp-json/domain-platform/v1/domains

Actual endpoint design should be finalized after the backend decision.

## Editable Content

Use WordPress/Gutenberg for:
- Marketing copy
- FAQs
- About content
- Testimonials
- Footer content
- General pages

Keep application-driven content dynamic:
- Domain availability
- Registrar pricing
- Domain status
- DNS records
- Renewals

## Future Backend Options

### Option A
WordPress Theme → WHMCS → HostAfrica

Best when:
- Faster launch is the priority
- WHMCS handles billing/client area/domain lifecycle

### Option B
WordPress Theme → Custom Plugin → HostAfrica

Best when:
- Fully custom UX is required
- The team is willing to build and maintain the business logic

The frontend should remain adaptable to either option.
