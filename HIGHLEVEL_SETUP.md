# HighLevel Lead Intake And Booking Setup

The home value and Listed forms post to `/api/highlevel-lead`. The endpoint creates or updates a HighLevel contact, saves readable survey answers, creates a contact note, and creates or updates one Client Journey opportunity.

Consultation booking uses the short planning questions first: intent, time frame, location, and budget/questions. Then the site pulls available times from the GoHighLevel calendar, asks for name, phone, and email, and creates the appointment directly in GoHighLevel with the first-form answers attached.

## Required Deployment Secrets

Add these environment variables in Vercel:

- `HIGHLEVEL_ACCESS_TOKEN`: HighLevel Private Integration token.
- `HIGHLEVEL_LOCATION_ID`: `2LNw0pwcDBoCxk3TGiSY`
- `HIGHLEVEL_CLIENT_JOURNEY_PIPELINE_ID`: optional override for the Client Journey pipeline ID. Defaults to `HjlpGqRjfF84myk6eI3h`.
- `HIGHLEVEL_CLIENT_JOURNEY_NEW_LEAD_STAGE_ID`: optional override for the Client Journey `New Lead` stage ID. Defaults to `510d9be9-da7b-47fe-b831-4e8a20722d05`.
- `HIGHLEVEL_CLIENT_JOURNEY_APPOINTMENT_STAGE_ID`: optional override for the Client Journey `Appointment Booked` stage ID. Defaults to `af295347-1e81-4e76-b5d0-4e659a4a0412`.
- `HIGHLEVEL_CALENDAR_ID`: calendar ID for the consultation calendar, currently `m1nSKgK0Zc86d2PxUSiq`.
- `HIGHLEVEL_CALENDAR_URL`: optional public booking URL for calendar `m1nSKgK0Zc86d2PxUSiq`. The site uses this only as a fallback if the direct calendar API cannot load time buttons.

Optional:

- `HIGHLEVEL_ASSIGNED_USER_ID`: assign incoming contacts to a specific HighLevel user.
- `HIGHLEVEL_CLIENT_JOURNEY_PIPELINE_NAME`: defaults to `Client Journey`; used to find the right pipeline by name if the ID lookup fails.
- `HIGHLEVEL_NEW_LEAD_STAGE_NAME`: defaults to `New Lead`.
- `HIGHLEVEL_APPOINTMENT_STAGE_NAME`: defaults to `Appointment Booked`.
- Old website pipeline variables can stay in Vercel while migrating, but the code now prefers Client Journey by its exact IDs.

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
- Tags -> simple manual-friendly labels:
  - `website lead` for any website submission
  - `buyer`, `seller`, or `exploring` when useful
  - `subscribe to newsletter` for market update signups
  - `test lead` for fake/test submissions
- Lead source, appointment status, meeting method, and form details stay in the Source field, pipeline, appointment, custom fields, and notes instead of becoming extra tags.
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

Use one simple `Client Journey` pipeline:

- `New Lead`
- `Contacted`
- `Appointment Booked`
- `Active Client`
- `Under Contract`
- `Closed`
- `Past Client`
- `Cold / Nurture`

Incoming website opportunities should enter `New Lead`. Booked consultations should enter `Appointment Booked`.

Opportunity names:

- `{Name} - Consultation Request`
- `{Name} - Home Value Request`
- `{Name} - Listed Search Lead`

## Appointment Booking Workflow

Create or update a HighLevel workflow:

- Trigger: appointment booked on calendar `m1nSKgK0Zc86d2PxUSiq`.
- Actions:
  - Move the related Client Journey opportunity to `Appointment Booked` if it is not already there.
  - Do not add extra source, status, or meeting-method tags.

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

Confirm `website lead`, `seller`, compact custom field notes, a contact note, and one `Home Value Request` opportunity.

The contact note should stay short and omit unanswered fields, for example:

```text
Home Value Request
Name: Website Home Value Test
Contact: website-home-value-test@example.com
Property: 123 Test Street
Message: Testing home value intake
```

Listed search:

- Name: `Website Listed Test`
- Email or phone: `website-listed-test@example.com`
- Note: `Testing Listed search lead without appointment`

Confirm `website lead`, `buyer`, compact custom field notes, a contact note, and one `Listed Search Lead` opportunity.

Newsletter:

- Name: optional
- Email: required

Confirm `website lead`, `subscribe to newsletter`, compact contact note, interest `Greater Moncton market update`, and no opportunity.
