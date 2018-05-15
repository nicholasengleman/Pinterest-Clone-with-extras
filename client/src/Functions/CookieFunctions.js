
export function FindCookie() {
	if (document.cookie) {
		let pinterestCookie = '';
		let pinterestCookieNameLength = 'pinterest-auth'.length + 1;
		let cookies = document.cookie;
		let begin = cookies.search('pinterest-auth');
		let end = cookies.indexOf(';', begin);

		if (end === -1) {
			pinterestCookie = document.cookie.substring(begin + pinterestCookieNameLength);
		} else {
			pinterestCookie = document.cookie.substring(begin + pinterestCookieNameLength, end);
		}
		return pinterestCookie;
	}
}

export function DeleteCookie() {
	document.cookie = "pinterest-auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}