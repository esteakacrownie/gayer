/* Copyright (C) 2026 esteakacrownie

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>. */

/**
 * Replaces characters in strings that are illegal/unsafe for filenames.
 * Unsafe characters are either removed or replaced by a substitute set
 * in the optional `options` object.
 *
 * Illegal Characters on Various Operating Systems
 * / ? < > \ : * | "
 * https://kb.acronis.com/content/39790
 *
 * Unicode Control codes
 * C0 0x00-0x1f & C1 (0x80-0x9f)
 * http://en.wikipedia.org/wiki/C0_and_C1_control_codes
 *
 * Reserved filenames on Unix-based systems (".", "..")
 * Reserved filenames in Windows ("CON", "PRN", "AUX", "NUL", "COM1",
 * "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
 * "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", and
 * "LPT9") case-insesitively and with or without filename extensions.
 *
 * Capped at 255 characters in length.
 * http://unix.stackexchange.com/questions/32795/what-is-the-maximum-allowed-filename-and-folder-size-with-ecryptfs
 **/

import truncateUtf8Bytes from "truncate-utf8-bytes"

var illegalRe = /[\/\?<>\\:\*\|"]/g
var controlRe = /[\x00-\x1f\x80-\x9f]/g
var reservedRe = /^\.+$/
var windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i

/**
 * Strip trailing spaces and dots, which are not allowed on some Windows file
 * systems. Does not use a regex to avoid a quadratic ReDoS vulnerability
 * (CWE-1333).
 */
function replaceTrailingDotsAndSpaces(str, replacement) {
	var end = str.length
	while (end > 0 && (str[end - 1] === "." || str[end - 1] === " ")) end--
	return end < str.length ? str.slice(0, end) + replacement : str
}

function sanitize(input, replacement) {
	if (typeof input !== "string") {
		throw new Error("Input must be string")
	}
	var sanitized = input
		.replace(illegalRe, replacement)
		.replace(controlRe, replacement)
		.replace(reservedRe, replacement)
		.replace(windowsReservedRe, replacement)
	sanitized = replaceTrailingDotsAndSpaces(sanitized, replacement)
	return truncateUtf8Bytes(sanitized, 255)
}

export const toSanitized = (input, options) => {
	var replacement = (options && options.replacement) || ""
	var output = sanitize(input, replacement)
	if (replacement === "") {
		return output
	}
	return sanitize(output, "")
}
