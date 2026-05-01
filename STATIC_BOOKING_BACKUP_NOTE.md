# Static Booking Backup Note

This branch was created by Codex as a safe backup branch for the fixed static booking website work from April 30, 2026.

Local source folder:

`/Users/raphael/Documents/Codex/2026-04-30/i-have-some-forms-on-my/raphaellemire-fixed-booking`

Local Git backup commit:

`2b1ab45ee8536d9fb40e2607e860f4ec7642ca09` - `Save website booking form backup`

Important: the full local folder contains about 7 MB of binary image assets. The GitHub connector available in Codex can create/edit text files, but it cannot stream the full local binary asset set into GitHub. To make this a complete cloud backup, push the local repo with GitHub CLI or GitHub Desktop from the folder above.

What is saved locally in Git:

- Website source: `index.html`, `app.js`, `styles.css`, `package.json`, `vercel.json`
- CRM/serverless API files in `api/`
- Setup notes in `HIGHLEVEL_SETUP.md`
- Image/contact assets in `assets/`

Binary asset checksums from the local backup:

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| assets/apple-touch-icon.png | 1978 | 08585361474c95f2cc4b7c892f45047e6c4374f79a2905ec72464b37fb8a2d95 |
| assets/exit-logo-black.png | 14947 | e1448c94024aad1fbd190d67bc9afbbabdb2c48006653aab6658e59e5f200dcb |
| assets/exit-logo-white.png | 16554 | 56de25877c1415a5024bb7b17a20bbfb581134dc5cd802ff46e02e7dc456fc99 |
| assets/listed-card.png | 1469493 | e76c66d1d301ec7d2ef2c4ffadbe8711e7af970ab7f8ad039faad291bde57c9c |
| assets/listed-disliked.png | 1480991 | 24ac82b5650e9f0180774b00d57556bb0acb2e6021d183d3258758d75448ad84 |
| assets/listed-liked.png | 1475921 | 214b089dfd3a336d820cb37ef6895fe5997173dca3311bd846fda1dae1314ec8 |
| assets/listed-map.png | 2192278 | 53ce2681f4cd704193bf738b162e9acedfc7f145654740bbf6fc36ed20ff25c5 |
| assets/raphael-favicon-16.png | 195 | 4669c34dd4f35685a478a38460956450505e4c7be5d54f6da787c77fd8b04f66 |
| assets/raphael-favicon-32.png | 343 | 061bfd52d91137fc2f34dfc312c25776b273bd86b5170ed66d2c71b3475b1e7e |
| assets/raphael-lemire-exit.jpg | 290690 | d24b66a5d48a17fe15d2ffcc7d53e0b3407fa87ac81db27e243376f47aa3bff1 |
| assets/raphael-site-icon-512.png | 6551 | eb09208df1560471e181b84d5400c22cce3cd7007c346a3aacab5149b3b442bd |
| favicon.ico | 13445 | 536129e95f5e69df7f01810e89230e612cf33cad4ee399bbd9eb46b0d3b84e9d |

Recommended next step for full backup:

1. Install/log into GitHub Desktop or GitHub CLI.
2. Open the local folder above.
3. Push the local `main` branch to a new private GitHub repo, or to a dedicated backup branch in `Raphael-lemire/raphael-website`.
