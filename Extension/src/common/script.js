/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Adguard Browser Extension.  If not, see <http://www.gnu.org/licenses/>.
 */

import { runtimeImpl } from './common-script';

/**
 * UI checkboxes utils
 *
 * @type {{toggleCheckbox, updateCheckbox}}
 */
export const CheckboxUtils = (function () {
    const updateAreaChecked = (el, checked) => {
        if (el) {
            el.setAttribute('aria-checked', checked);
        }
    };

    /**
     * Toggles wrapped elements with checkbox UI
     *
     * @param {Array.<Object>} elements
     */
    const toggleCheckbox = function (elements) {
        Array.prototype.forEach.call(elements, (checkbox) => {
            if (checkbox.getAttribute('toggleCheckbox')) {
                // already applied
                return;
            }

            const el = document.createElement('div');
            el.classList.add('toggler');
            checkbox.parentNode.insertBefore(el, checkbox.nextSibling);

            el.parentNode.addEventListener('click', () => {
                checkbox.checked = !checkbox.checked;

                const event = document.createEvent('HTMLEvents');
                event.initEvent('change', true, false);
                checkbox.dispatchEvent(event);
            });

            checkbox.addEventListener('change', () => {
                onClicked(checkbox.checked);
            });

            function onClicked(checked) {
                if (checked) {
                    el.classList.add('active');
                    el.closest('li').classList.add('active');
                } else {
                    el.classList.remove('active');
                    el.closest('li').classList.remove('active');
                }
                updateAreaChecked(el.closest('.toggler-wr'), checked);
            }

            checkbox.style.display = 'none';
            onClicked(checkbox.checked);

            checkbox.setAttribute('toggleCheckbox', 'true');
        });
    };

    /**
     * Updates checkbox elements according to checked parameter
     *
     * @param {Array.<Object>} elements
     * @param {boolean} checked
     */
    const updateCheckbox = function (elements, checked) {
        Array.prototype.forEach.call(elements, (el) => {
            if (!el || el.checked === checked) {
                return;
            }
            if (checked) {
                el.setAttribute('checked', 'checked');
                el.closest('li').classList.add('active');
                el.checked = checked;
            } else {
                el.removeAttribute('checked');
                el.closest('li').classList.remove('active');
                el.checked = false;
            }
            updateAreaChecked(el.closest('.toggler-wr'), !!checked);
        });
    };

    return {
        toggleCheckbox,
        updateCheckbox,
    };
})();

/**
 * Used to receive notifications from background page
 * @param events Events for listening
 * @param callback Event listener callback
 * @param onUnloadCallback Window unload callback
 */
export async function createEventListener(events, callback, onUnloadCallback) {
    function eventListener() {
        callback.apply(null, arguments);
    }

    const response = await runtimeImpl.sendMessage({ type: 'addEventListener', events });
    let listenerId = response.listenerId;

    runtimeImpl.onMessage.addListener(function (message) {
        if (message.type === 'notifyListeners') {
            eventListener.apply(this, message.args);
        }
    });

    const onUnload = function () {
        if (listenerId) {
            runtimeImpl.sendMessage({ type: 'removeListener', listenerId });
            listenerId = null;
            if (typeof onUnloadCallback === 'function') {
                onUnloadCallback();
            }
        }
    };

    window.addEventListener('beforeunload', onUnload);
    window.addEventListener('unload', onUnload);
}

/**
 * Creates HTMLElement from string
 *
 * @param {String} html representing a single element
 * @return {Element}
 */
export function htmlToElement(html) {
    const template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}