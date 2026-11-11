// Everything you are likely to change lives here.
window.SITE = {
  // 11 am Pacific on the wedding day. December in San Jose is UTC-8.
  weddingStart: "2026-12-17T11:00:00-08:00",
  weddingEnd: "2026-12-17T16:00:00-08:00",

  // Swap for the venue's Google Maps link once it is confirmed.
  mapUrl: "https://www.google.com/maps/search/?api=1&query=San+Jose%2C+California",

  // Leave empty to show "Please reply as soon as you can."
  replyBy: "",

  // Where replies are stored: the "ritvik-vineesha-wedding" Supabase project.
  // The publishable key is meant to be public. Row level security lets guests
  // add a reply but never read one (see supabase/rsvps.sql). VITE_SUPABASE_URL
  // and VITE_SUPABASE_ANON_KEY override these, for example to test elsewhere.
  rsvp: {
    url: import.meta.env.VITE_SUPABASE_URL || "https://zsqalbgdmrcuuviicinm.supabase.co",
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_tx1x3byQsLZ57xgD9xFbrA_Myb73js-",
  },

  // "Us, so far": the photos drift past on their own. w and h are each photo's shape.
  reel: [
    { src: "moment-1", w: 3, h: 4, caption: "A whole city lit up. He looked at her anyway.", alt: "Ritvik with his arm around Vineesha at a window high above a city at night" },
    { src: "moment-3", w: 4, h: 3, caption: "Walking off into the sunset. Literally.", alt: "Silhouette of Ritvik and Vineesha holding hands beside a large tree at dusk" },
    { src: "moment-2", w: 3, h: 4, caption: "Brunch, then forever.", alt: "Ritvik and Vineesha outside a cafe under pink bougainvillea" },
    { src: "moment-4", w: 4, h: 3, caption: "Golden hour, and neither of us letting go.", alt: "Ritvik smiling as Vineesha hugs him, both in white, against a golden hillside" },
    { src: "moment-5", w: 4, h: 3, caption: "Arm's length is as far apart as we get.", alt: "Selfie of Vineesha in a gold blouse and Ritvik in a lavender shirt" },
    { src: "moment-6", w: 3, h: 4, caption: "Celebrating big moments together", alt: "Ritvik and Vineesha smiling together in a nighttime selfie" },
  ],
};
