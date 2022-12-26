import { Popover } from 'bootstrap';
import { postForm } from './_networking';
import { Notifications, notifyError } from './_notifications';


export default function init(Document, table) {
    const frmNewMember = Document.getElementById('frmNewMember'),
          btnNewMember = Document.getElementById('btnNewMember'),
          eStudentName = Document.getElementById('mdlNewMember_studentName');

    if (frmNewMember && btnNewMember && eStudentName) {
        const popNewMember = new Popover(Document.getElementById('btnNewMember'), {
            container: 'body',
            html: true,
            content: frmNewMember,
            trigger: 'manual',
        });

        const notifications = new Notifications(Document);

        btnNewMember.addEventListener('click', function () {
            popNewMember.toggle();
        });

        btnNewMember.addEventListener('shown.bs.popover', function () {
            eStudentName.focus();
        });

        frmNewMember.addEventListener('click', function (e) {
            if (e.target && e.target.id == 'mdlNewMember_submit') {
                postForm(frmNewMember)('/api/members/add').then(function (r) {
                    notifications.success('Member added');
                    popNewMember.hide();
                    frmNewMember.reset();
                    table.ajax.reload();
                }).catch(notifyError(notifications));

                e.preventDefault();
            }
        });
    }
}
