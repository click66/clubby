import { Modal, Tab } from "bootstrap";
import { postJson, postNone } from "./js/_networking";
import { Notifications, notifyError } from './js/_notifications'


const notifications = new Notifications(document),
      frmUpdateProfile = document.getElementById('frmUpdateMemberProfile'),
      btnDeleteMember = document.getElementById('btnDelete'),
      btnUpdateLicence = document.querySelector('.btnUpdateLicence'),
      mdlUpdateLicence = new Modal(document.getElementById('mdlUpdateLicence')),
      frmLicence = document.getElementById('frmLicence'),
      btnAddNote = document.getElementById('btnAddNote'),
      mdlNote = new Modal(document.getElementById('mdlNote')),
      frmNote = document.getElementById('frmNote'),
      btnAddPayment = document.getElementById('btnAddPayment'),
      mdlPayment = new Modal(document.getElementById('mdlPayment')),
      frmPayment = document.getElementById('frmPayment');

btnUpdateLicence.addEventListener('click', function () {
    mdlUpdateLicence.show();
});

frmLicence.addEventListener('submit', function (e) {
    let fd = new FormData(this);

    e.preventDefault();
    
    postJson(
        fd.get('csrfmiddlewaretoken'),
        Object.fromEntries(fd.entries()),
    )(`/api/members/${this.dataset.uuid}/licences/add`).then(function (r) {
        location.reload();
    }).catch(notifyError(notifications));
});

frmUpdateProfile.addEventListener('submit', function (e) {
    e.preventDefault();
    postJson(
        this.dataset.csrfToken, 
        Object.fromEntries(new FormData(frmUpdateProfile).entries()),
    )(`/api/members/${this.dataset.uuid}/profile`).then(function (r) {
        notifications.success('Member details have been updated');
    }).catch(notifyError(notifications));
});

btnDeleteMember.addEventListener('click', function () {
    if (confirm("Are you sure? This will delete this member's record and all associated attendance records.")) {
        postNone(this.dataset.csrfToken)(`/api/members/delete/${this.dataset.uuid}`).then(function (r) {
            location.href = '/members';
        }).catch(notifyError(notifications));
    }
});

btnAddNote.addEventListener('click', function () {
    mdlNote.show();
});

frmNote.addEventListener('submit', function (e) {
    e.preventDefault();
    postJson(this.dataset.csrfToken, {
        'text': new FormData(this).get('text'),
    })(`/api/members/${this.dataset.uuid}/notes/add`).then(function () {
        location.reload();
    }).catch(notifyError(notifications));
});

btnAddPayment.addEventListener('click', function () {
    mdlPayment.show();
});

frmPayment.addEventListener('submit', function (e) {
    e.preventDefault();
    postJson(this.dataset.csrfToken, {
        'product': new FormData(this).get('product'),
    })(`/api/members/${this.dataset.uuid}/payments/add`).then(function () {
        location.reload();
    }).catch(notifyError(notifications));
});

[...document.querySelectorAll('#tabsMember button')].forEach(function (te) {
    let tab = Tab.getOrCreateInstance(te),
        url = new URL(window.location),
        hash = url.hash.substring(1);
    
    if (hash) {
        history.replaceState({'tab': hash}, document.title, url);
    }

    if (tab._element.dataset.tabkey == hash) {
        tab.show();
    }

    tab._element.addEventListener('click', function (e) {
        url.hash = e.target.dataset.tabkey;
        history.pushState({'tab': e.target.dataset.tabkey}, document.title, url);
    })
});

window.onpopstate = function (e) {
    let tab = 'profile';
    if (e.state && e.state.hasOwnProperty('tab')) {
        tab = e.state.tab;
    }
    if (tab) {
        let te = document.querySelector('#tabsMember button[data-tabkey=' + tab + ']');
        if (te) {
            Tab.getOrCreateInstance(te).show();
        }
    }
}
