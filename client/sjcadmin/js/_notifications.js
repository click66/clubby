import { Toast } from "bootstrap";


function makeToast(Document, type) {
    let t = Document.createElement('div'),
        tinner = Document.createElement('div'),
        tbody = Document.createElement('div'),
        btn = Document.createElement('button');

    t.classList.add('toast', 'align-items-center');
    t.setAttribute('role', 'alert');
    t.setAttribute('aria-live', 'assertive');
    t.setAttribute('aria-atomic', 'true');
    tinner.classList.add('d-flex');
    tbody.classList.add('toast-body');
    btn.setAttribute('type', 'button');
    btn.classList.add('btn-close', 'btn-close-white', 'me-2', 'm-auto');
    btn.dataset.bsDismiss = 'toast';
    btn.setAttribute('aria-label', 'Close');

    switch (type) {
        case 'error':
            t.classList.add('text-white', 'bg-danger');
            break;
        case 'success':
            t.classList.add('text-white', 'bg-success');
            break;
    }

    t.appendChild(tinner);
    tinner.appendChild(tbody);
    tinner.appendChild(btn);

    return t;
}

class Notifications {
    constructor(doc) {
        this.doc = doc;
    }

    notify(type, text) {
        let r = makeToast(this.doc, type);
        r.querySelector('.toast-body').appendChild(this.doc.createTextNode(text));
        this.doc.getElementById('toastRack').appendChild(r);
        Toast.getOrCreateInstance(r).show();
    }

    success(text) {
        this.notify('success', text);
    }

    error(text) {
        this.notify('error', text);
    }
}

const notifyError = notifications => function (text) {
    notifications.error(text);
}

export { Notifications, notifyError };
