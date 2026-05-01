# HighLevel Lead Intake And Booking Setup

The home value and Listed forms post to `/api/highlevel-lead`. The endpoint creates or updates a HighLevel contact, saves readable survey answers, and creates or updates one Website Leads opportunity.

Consultation booking uses the short planning questions first: intent, time frame, location, and budget/questions. Then the site pulls available times from the GoHighLevel calendar, asks for name, phone, and email, and creates the appointment directly in GoHighLevel with the first-form answers attached.

## Required Deployment Secrets

Add these environment variables in Vercel:

- `HIGHLEVEL_ACCESS_TOKEN`: HighLevel Private Integration token.
- `HIGHLEVEL_LOCATION_ID`: `2LNw0pwcDBoCxk3TGiSY`
- `HIGHLEVEL_WEBSITE_PIPELINE_ID`: Website Leads pipeline ID.
- `HIGHLEVEL_NEW_LEAD_STAGE_ID`: stage ID for `New Website Lead`.
- `HIGHLEVEL_CALENDAR_ID`: calendar ID for the consultation calendar, currently `m1nSKgK0Zc86d2PxUSiq`.
- `HIGHLEVEL_CALENDAR_URL`: optional public booking URL for calendar `m1nSKgK0Zc86d2PxUSiq`. The site uses this only as a fallback if the direct calendar API cannot load time buttons.

Optional:

- `HIGHLEVEL_ASSIGNED_USER_ID`: assign incoming contacts to a specific HighLevel user.
- `HIGHLEVEL_WEBSITE_NEW_STAGE_ID`: fallback alias for `HIGHLEVEL_NEW_LEAD_STAGE_ID`.
- Existing old stage variables can stay in place while migrating: `HIGHLEVEL_CONSULT_STAGE_ID`, `HIGHLEVEL_LISTED_STAGE_ID`, and `HIGHLEVEL_HOME_VALUE_STAGE_ID`. The endpoint only uses them if the new lead stage ID is missing.

## Required Private Integration Scopes

- `contacts.write`
- `opportunities.write`
- `opportunities.readonly` if HighLevel requires it for opportunity upsert or duplicate checks
- `calendars.readonly` for `/calendars/{calendarId}/free-slots`
- `calendars/events.write` for creating booked appointments

## Contact Mapping

- Name -> HighLevel contact name.
- Email or phone -> HighLevel email/phone.
- Type -> `lead`.
- Source -> `raphaellemire.com consultation`, `raphaellemire.com home value`, `raphaellemire.com listed download`, or `raphaellemire.com website`.
- Tags -> clean management tags:
  - `website lead`
  - `source: consultation`, `source: home value`, or `source: listed`
  - `intent: buyer`, `intent: seller`, `intent: buy-sell`, or `intent: exploring` when known
  - `status: appointment not booked` for consultation and Listed search leads
  - `test lead` for fake/test submissions
- Survey answers -> existing HighLevel custom fields:
  - Intent: `hsXnTsP8vjCKtgEtkqSR`
  - Timeline: `z9OkdeXN9YcA70o0x8Ft`
  - Budget / price range: `WingGOKNAdhVqoYmzM27`
  - Area: `8sMD8z7vEw1WZTj2Q4dS`
  - Property address: `vah7vOKAUvKWSuZyWGml`
  - Notes: `HqjHgWIanPmKk1oFrHeu`
- Appointment -> created on the GoHighLevel calendar after the site re-checks that the selected slot is still free.

The notes field stores a readable summary, for example:

```text
Lead source: consultation
Intent: Buy
Timeline: 0-3 months
Area: Moncton
Budget / price range: $450,000, detached home, questions about timing
Original page: https://www.raphaellemire.com/
```

## Pipeline Setup

Use one simple `Website Leads` pipeline:

- `New Website Lead`
- `Needs Follow-Up`
- `Appointment Booked`
- `Active Client`
- `Nurture`
- `Closed / Lost`

Incoming website opportunities should enter `New Website Lead` through `HIGHLEVEL_NEW_LEAD_STAGE_ID`.

Opportunity names:

- `{Name} - Consultation Request`
- `{Name} - Home Value Request`
- `{Name} - Listed Search Lead`

## Appointment Booking Workflow

Create or update a HighLevel workflow:

- Trigger: appointment booked on calendar `m1nSKgK0Zc86d2PxUSiq`.
- Actions:
  - Add tag `status: appointment booked`.
  - Remove tag `status: appointment not booked`.
  - Move the related Website Leads opportunity to `Appointment Booked`.

Do not add marketing follow-up emails or texts unless consent is handled separately.

## Fake Test Leads

Consultation:

- Intent: `Just exploring options`
- Time frame: `0-3 months`
- Location: `Moncton`
- Budget and other questions: `Testing budget/questions field and calendar redirect`

Confirm:

- The first screen does not ask for name, phone, or email.
- Available time buttons load from calendar `m1nSKgK0Zc86d2PxUSiq`.
- Name, phone, and email are requested after a time is selected.
- The contact, opportunity, appointment, and appointment note are created in GoHighLevel.

Home value:

- Name: `Website Home Value Test`
- Email or phone: `website-home-value-test@example.com`
- Address: `123 Test Street`
- Note: `Testing home value intake`

Confirm `website lead`, `source: home value`, readable notes, and one `Home Value Request` opportunity.

Listed search:

- Name: `Website Listed Test`
- Email or phone: `website-listed-test@example.com`
- Note: `Testing Listed search lead without appointment`

Confirm `website lead`, `source: listed`, `status: appointment not booked`, readable notes, and one `Listed Search Lead` opportunity.
