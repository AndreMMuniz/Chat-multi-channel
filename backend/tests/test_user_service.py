"""
Unit tests for UserService.
Uses the in-memory SQLite DB from conftest — no real Postgres or Supabase.
Supabase calls are mocked.
"""

import pytest
from unittest.mock import MagicMock, patch
from uuid import uuid4

from app.services.user_service import UserService
from app.models.models import User, UserType, DefaultRole


# ── Helpers ───────────────────────────────────────────────────────────────────

def make_user_type(db, name="User", base_role=DefaultRole.USER, is_system=True) -> UserType:
    ut = UserType(name=name, base_role=base_role, is_system=is_system)
    db.add(ut)
    db.commit()
    db.refresh(ut)
    return ut


def make_user(db, user_type_id, email="test@example.com") -> User:
    u = User(
        auth_id=str(uuid4()),
        email=email,
        full_name="Test User",
        user_type_id=user_type_id,
        is_active=True,
        is_approved=True,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


# ── seed_default_user_types ───────────────────────────────────────────────────

class TestSeedDefaultUserTypes:
    def test_creates_three_system_roles(self, db):
        svc = UserService(db)
        svc.seed_default_user_types()
        count = db.query(UserType).filter(UserType.is_system == True).count()
        assert count == 3

    def test_idempotent_second_call(self, db):
        svc = UserService(db)
        svc.seed_default_user_types()
        svc.seed_default_user_types()
        count = db.query(UserType).filter(UserType.is_system == True).count()
        assert count == 3

    def test_creates_admin_manager_user(self, db):
        UserService(db).seed_default_user_types()
        names = {ut.name for ut in db.query(UserType).all()}
        assert {"Admin", "Manager", "User"} == names


# ── get_user_type ─────────────────────────────────────────────────────────────

class TestGetUserType:
    def test_returns_none_for_missing(self, db):
        svc = UserService(db)
        result = svc.get_user_type(uuid4())
        assert result is None

    def test_returns_existing(self, db):
        ut = make_user_type(db)
        result = UserService(db).get_user_type(ut.id)
        assert result is not None
        assert result.id == ut.id


# ── create_user_type ──────────────────────────────────────────────────────────

class TestCreateUserType:
    def test_creates_non_system_type(self, db):
        svc = UserService(db)
        data = {"name": "Support", "base_role": DefaultRole.USER}
        ut = svc.create_user_type(data)
        assert ut.id is not None
        assert ut.is_system is False
        assert ut.name == "Support"


# ── update_user ───────────────────────────────────────────────────────────────

class TestUpdateUser:
    def test_updates_full_name(self, db):
        ut = make_user_type(db)
        user = make_user(db, ut.id)
        svc = UserService(db)
        updated = svc.update_user(user, {"full_name": "New Name"})
        assert updated.full_name == "New Name"

    def test_update_logs_audit(self, db):
        from app.models.models import AuditLog
        actor_ut = make_user_type(db, "Admin", DefaultRole.ADMIN)
        actor = make_user(db, actor_ut.id, email="admin@example.com")
        ut = make_user_type(db, "User2", is_system=False)
        user = make_user(db, ut.id, email="user2@example.com")
        svc = UserService(db)
        svc.update_user(user, {"full_name": "Updated"}, actor_id=actor.id, ip_address="1.2.3.4")
        log = db.query(AuditLog).filter(AuditLog.action == "update_user").first()
        assert log is not None
        assert str(log.user_id) == str(actor.id)


# ── enable / disable ─────────────────────────────────────────────────────────

class TestEnableDisableUser:
    def test_disable_sets_inactive(self, db):
        ut = make_user_type(db)
        user = make_user(db, ut.id)
        svc = UserService(db)
        result = svc.disable_user(user)
        assert result.is_active is False

    def test_enable_sets_active(self, db):
        ut = make_user_type(db)
        user = make_user(db, ut.id)
        user.is_active = False
        db.commit()
        result = UserService(db).enable_user(user)
        assert result.is_active is True


# ── approve_user ─────────────────────────────────────────────────────────────

class TestApproveUser:
    @patch("app.services.user_service.send_approval_email")
    def test_approve_sets_flags(self, mock_email, db):
        ut = make_user_type(db)
        user = make_user(db, ut.id)
        user.is_approved = False
        user.is_active = False
        db.commit()
        result = UserService(db).approve_user(user)
        assert result.is_approved is True
        assert result.is_active is True
        mock_email.assert_called_once()


# ── delete_user ───────────────────────────────────────────────────────────────

class TestDeleteUser:
    @patch("app.services.user_service.UserService.supabase", new_callable=MagicMock)
    def test_delete_removes_from_db(self, mock_supabase, db):
        ut = make_user_type(db)
        user = make_user(db, ut.id)
        user_id = user.id
        # Patch the supabase property to return a mock
        mock_supabase.auth.admin.delete_user = MagicMock(return_value=None)
        UserService(db).delete_user(user)
        found = db.query(User).filter(User.id == user_id).first()
        assert found is None


# ── update_user_type ──────────────────────────────────────────────────────────

class TestUpdateUserType:
    def test_updates_name(self, db):
        ut = make_user_type(db, name="Support")
        updated = UserService(db).update_user_type(ut, {"name": "Support L2"})
        assert updated.name == "Support L2"

    def test_updates_permission(self, db):
        ut = make_user_type(db)
        updated = UserService(db).update_user_type(ut, {"can_view_all_conversations": True})
        assert updated.can_view_all_conversations is True


# ── delete_user_type ──────────────────────────────────────────────────────────

class TestDeleteUserType:
    def test_delete_removes_from_db(self, db):
        ut = make_user_type(db, name="Temp Role", is_system=False)
        ut_id = ut.id
        UserService(db).delete_user_type(ut)
        found = db.query(UserType).filter(UserType.id == ut_id).first()
        assert found is None


# ── get_default_role ──────────────────────────────────────────────────────────

class TestGetDefaultRole:
    def test_returns_none_before_seeding(self, db):
        result = UserService(db).get_default_role()
        assert result is None

    def test_returns_user_role_after_seeding(self, db):
        UserService(db).seed_default_user_types()
        role = UserService(db).get_default_role()
        assert role is not None
        assert role.name == "User"


# ── reject_user ───────────────────────────────────────────────────────────────

class TestRejectUser:
    @patch("app.services.user_service.UserService.supabase", new_callable=MagicMock)
    def test_reject_deletes_user(self, mock_supabase, db):
        """reject_user should remove the user from DB."""
        ut = make_user_type(db)
        user = make_user(db, ut.id)
        user_id = user.id
        mock_supabase.auth.admin.delete_user = MagicMock(return_value=None)

        svc = UserService(db)
        # reject_user may call delete_user internally — try both
        if hasattr(svc, "reject_user"):
            svc.reject_user(user)
        else:
            svc.delete_user(user)

        found = db.query(User).filter(User.id == user_id).first()
        assert found is None

    @patch("app.services.user_service.UserService.supabase", new_callable=MagicMock)
    def test_reject_user_with_actor_logs_audit(self, mock_supabase, db):
        from app.models.models import AuditLog
        actor_ut = make_user_type(db, "Admin2", DefaultRole.ADMIN)
        actor = make_user(db, actor_ut.id, email="actor2@example.com")
        ut = make_user_type(db, "Temp1", is_system=False)
        user = make_user(db, ut.id, email="reject2@example.com")
        mock_supabase.auth.admin.delete_user = MagicMock(return_value=None)
        UserService(db).reject_user(user, actor_id=actor.id)
        log = db.query(AuditLog).filter(AuditLog.action == "reject_user").first()
        assert log is not None

    @patch("app.services.user_service.UserService.supabase", new_callable=MagicMock)
    def test_reject_user_survives_supabase_exception(self, mock_supabase, db):
        ut = make_user_type(db, "Temp2", is_system=False)
        user = make_user(db, ut.id, email="reject3@example.com")
        user_id = user.id
        mock_supabase.auth.admin.delete_user = MagicMock(side_effect=Exception("Supabase down"))
        UserService(db).reject_user(user)  # must not raise
        assert db.query(User).filter(User.id == user_id).first() is None


# ── delete_user extended ──────────────────────────────────────────────────────

class TestDeleteUserExtended:
    @patch("app.services.user_service.UserService.supabase", new_callable=MagicMock)
    def test_delete_user_with_actor_logs_audit(self, mock_supabase, db):
        from app.models.models import AuditLog
        actor_ut = make_user_type(db, "Admin3", DefaultRole.ADMIN)
        actor = make_user(db, actor_ut.id, email="actor3@example.com")
        ut = make_user_type(db, "Temp3", is_system=False)
        user = make_user(db, ut.id, email="delete2@example.com")
        mock_supabase.auth.admin.delete_user = MagicMock(return_value=None)
        UserService(db).delete_user(user, actor_id=actor.id)
        log = db.query(AuditLog).filter(AuditLog.action == "delete_user").first()
        assert log is not None

    @patch("app.services.user_service.UserService.supabase", new_callable=MagicMock)
    def test_delete_user_survives_supabase_exception(self, mock_supabase, db):
        ut = make_user_type(db, "Temp4", is_system=False)
        user = make_user(db, ut.id, email="delete3@example.com")
        user_id = user.id
        mock_supabase.auth.admin.delete_user = MagicMock(side_effect=Exception("Supabase down"))
        UserService(db).delete_user(user)  # must not raise
        assert db.query(User).filter(User.id == user_id).first() is None


# ── approve_user with actor ───────────────────────────────────────────────────

class TestApproveUserExtended:
    @patch("app.services.user_service.send_approval_email")
    def test_approve_user_with_actor_logs_audit(self, mock_email, db):
        from app.models.models import AuditLog
        actor_ut = make_user_type(db, "Admin4", DefaultRole.ADMIN)
        actor = make_user(db, actor_ut.id, email="actor4@example.com")
        ut = make_user_type(db, "Temp5", is_system=False)
        user = make_user(db, ut.id, email="approve2@example.com")
        user.is_approved = False
        user.is_active = False
        db.commit()
        UserService(db).approve_user(user, actor_id=actor.id)
        log = db.query(AuditLog).filter(AuditLog.action == "approve_user").first()
        assert log is not None


# ── enable/disable with actor ─────────────────────────────────────────────────

class TestEnableDisableUserExtended:
    def test_enable_user_with_actor_logs_audit(self, db):
        from app.models.models import AuditLog
        actor_ut = make_user_type(db, "Admin5", DefaultRole.ADMIN)
        actor = make_user(db, actor_ut.id, email="actor5@example.com")
        ut = make_user_type(db, "Temp6", is_system=False)
        user = make_user(db, ut.id, email="enable2@example.com")
        user.is_active = False
        db.commit()
        UserService(db).enable_user(user, actor_id=actor.id)
        log = db.query(AuditLog).filter(AuditLog.action == "enable_user").first()
        assert log is not None

    def test_disable_user_with_actor_logs_audit(self, db):
        from app.models.models import AuditLog
        actor_ut = make_user_type(db, "Admin6", DefaultRole.ADMIN)
        actor = make_user(db, actor_ut.id, email="actor6@example.com")
        ut = make_user_type(db, "Temp7", is_system=False)
        user = make_user(db, ut.id, email="disable2@example.com")
        db.commit()
        UserService(db).disable_user(user, actor_id=actor.id)
        log = db.query(AuditLog).filter(AuditLog.action == "disable_user").first()
        assert log is not None


# ── change_password ───────────────────────────────────────────────────────────

class TestChangePassword:
    @patch("app.services.user_service.UserService.supabase", new_callable=MagicMock)
    def test_change_password_calls_supabase(self, mock_supabase, db):
        ut = make_user_type(db, "Temp8", is_system=False)
        user = make_user(db, ut.id, email="pwchange@example.com")
        mock_supabase.auth.admin.update_user_by_id = MagicMock(return_value=None)
        UserService(db).change_password(user, "NewPass123!")
        mock_supabase.auth.admin.update_user_by_id.assert_called_once_with(
            user.auth_id, {"password": "NewPass123!"}
        )


# ── get_user_service factory ──────────────────────────────────────────────────

def test_get_user_service_returns_instance(db):
    from app.services.user_service import get_user_service
    svc = get_user_service(db)
    assert isinstance(svc, UserService)
