import { Modal } from 'bootstrap';


document.querySelectorAll('.report-modal').forEach(function (modal) {
    let mdl = new Modal(modal);

    document.querySelector(`a.report-link[data-report="${modal.dataset.report}"]`).addEventListener('click', function () {
        mdl.show();
    });

    modal.querySelector('.btn-cancel').addEventListener('click', function () {
        mdl.hide();
    })
})
