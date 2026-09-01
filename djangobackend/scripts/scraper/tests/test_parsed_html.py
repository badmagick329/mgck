from scripts.scraper.parsed_html import ParsedHTML


def test_release_list_finds_nested_reddit_links():
    html = """
        <table>
            <tbody>
                <tr>
                    <td>18th</td>
                    <td>6PM</td>
                    <td>IHWAK</td>
                    <td>I PROMISE YOU THAT SEVEN KINDS</td>
                    <td>Single</td>
                    <td><p><a href="https://youtu.be/example">Title</a></p></td>
                    <td>
                        <a href="https://open.spotify.com/album/example">Spotify</a>
                        <a href="https://music.apple.com/gb/album/example">Apple Music</a>
                        <a href="https://music.youtube.com/playlist?list=example">YouTube Music</a>
                    </td>
                </tr>
            </tbody>
        </table>
    """

    releases = ParsedHTML(
        html,
        "https://reddit.com/2026/august/",
    ).release_list()

    assert releases[0].reddit_urls == ["https://youtu.be/example"]
    assert releases[0].spotify_urls == [
        "https://open.spotify.com/album/example"
    ]
    assert releases[0].apple_music_urls == [
        "https://music.apple.com/gb/album/example"
    ]
