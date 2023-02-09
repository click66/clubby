import { Modal } from 'bootstrap';
import { postJson } from './js/_networking';
import { Notifications, notifyError } from './js/_notifications';


document.querySelectorAll('.report-modal').forEach(function (modal) {
    let mdl = new Modal(modal);

    document.querySelector(`a.report-link[data-report="${modal.dataset.report}"]`).addEventListener('click', function () {
        mdl.show();
    });

    modal.querySelector('.btn-cancel').addEventListener('click', function () {
        mdl.hide();
    })
})
