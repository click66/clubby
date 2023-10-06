"""Changed student to member for domain language consistencyu

Revision ID: 5604f170e72f
Revises: 1880a8982b2f
Create Date: 2023-10-06 11:19:11.668095

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5604f170e72f'
down_revision: Union[str, None] = '1880a8982b2f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('sjcattendance_attendance', 'student_uuid', new_column_name='member_uuid')


def downgrade() -> None:
    op.alter_column('sjcattendance_attendance', 'member_uuid', new_column_name='student_uuid')
