# Book Cricket Unity WebGL

Standalone Unity version of Book Cricket for the Faded Games website.

## Game Rules

- Player bats first against the computer.
- Each innings has 18 balls and 3 wickets.
- Flip a page to reveal a page number.
- The final digit decides the result: 1-6 are runs, 0 is a wicket.
- The second innings chases `first innings score + 1`.

## Open In Unity

1. Open `unity/book-cricket` from Unity Hub.
2. Use Unity 2021.3 LTS or newer.
3. Run `Faded Games > Create Book Cricket Scene`.
4. Press Play to test in the editor.

## Export WebGL Into The Website

1. Switch platform to WebGL in `File > Build Settings`.
2. For the first website build, use compression `Disabled`.
3. Run `Faded Games > Build Book Cricket WebGL Into Website`.
4. The build is written to `client/public/unity/book-cricket`.
5. Start the website and open Book Cricket from Home.

The editor build command also writes `book-cricket-build.json`, which lets the React loader find Unity's generated file names.
