const mdlNewMemberInner = document.getElementById('mdlNewMember'),
      mdlNewMember = new bootstrap.Modal(mdlNewMemberInner),
      frmNewMember = $('#frmNewMember');

const popNewMember = new bootstrap.Popover(document.getElementById('btnNewMember'), {
    container: 'body',
    html: true,
    content: document.getElementById('frmNewMember'),
    trigger: 'manual',
});

document.getElementById('btnNewMember').addEventListener('click', function () {
    popNewMember.toggle();
});

frmNewMember.on('click', '#mdlNewMember_submit', function (e) {
    $.post('/api/members/add', frmNewMember.serialize())
        .done(function(d) {
            if (d.hasOwnProperty('error')) {
                alert(d.error);
            } else {
                frmNewMember.trigger('reset');
                table.ajax.reload();
            }
            popNewMember.hide();
        });

    e.preventDefault();
});
