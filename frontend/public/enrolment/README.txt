Enrolment page assets.

These are the real files from the Claude Design project "Inflink Mobile App", taken from
the handoff export rather than read through the design API. The API caps a single file read
at 256 KiB, and three of these stickers are larger than that, so they came back truncated
and would have rendered as broken images.

What the enrolment design actually references, and where:

  following-logo.png       the header on every screen, and the splash "partners with
                           Inflink" row. Black wordmark, inverted to white in CSS exactly
                           as the design does it.
  inflink-logo-white.png   the celebration card, the app screen, and the expired screen.
  sticker-coin.png         splash, and the celebration screen.
  sticker-signed.png       splash, and the receipt header.
  sticker-bolt.png         splash, and the celebration screen.
  sticker-youin.png        splash, and the celebration screen.

cover-studio.png is NOT here on purpose. The design uses it as the talent manager's
portrait on the cancelled screen. It is a stock photograph, and putting a stranger's face
next to a real colleague's name in front of a creator presents someone who does not exist,
so that avatar renders the assigned talent member's initials instead. It was also 3.8 MB
for a 40 pixel circle.

Every sticker renders through <Sticker>, which fails silently to nothing if a file is
missing. The layout is correct either way.
