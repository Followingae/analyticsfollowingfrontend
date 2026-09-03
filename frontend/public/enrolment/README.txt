Enrolment page stickers.

sticker-bolt.png came through intact from the Claude Design project.

sticker-coin.png, sticker-signed.png and sticker-youin.png are MISSING: each is
larger than the 256 KiB cap on reading a file out of the design project, so they
arrived truncated and would have rendered as broken images. Export them from the
design project and drop them in here with those exact names.

The page does not depend on them. Every sticker is rendered through <Sticker>,
which fails silently to nothing if the file is absent, so the layout is correct
either way and simply gains the stickers the moment the files land.
