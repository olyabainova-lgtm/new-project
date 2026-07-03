# TeacherFlow MVP

Run with `npm install` and `npm run dev`.

## Email setup

Copy `.env.example` to `.env` and add the EmailJS service ID, template ID, and public key. The EmailJS template should accept `to_email`, `to_name`, `reply_to`, `from_name`, `subject`, and `message`. Restart Vite after changing environment variables.

Without these values, teacher actions still update normally and generated messages remain available to preview and copy. Email attempts are logged as failed with a clear configuration message.

Supervision files are stored locally in IndexedDB and are not sent by email in this MVP.

## Teacher login setup

Set `VITE_TEACHER_EMAIL` and `VITE_TEACHER_PASSWORD` in `.env`, then restart Vite. The example email is `o_bainova@kazguu.kz`.

This is frontend-only MVP protection: Vite variables can be inspected in the browser bundle. Real secure authentication requires a backend or authentication provider.
