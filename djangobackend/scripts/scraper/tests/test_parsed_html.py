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
                    <td></td>
                </tr>
            </tbody>
        </table>
    """

    releases = ParsedHTML(
        html,
        "https://reddit.com/2026/august/",
    ).release_list()

    assert releases[0].reddit_urls == ["https://youtu.be/example"]
