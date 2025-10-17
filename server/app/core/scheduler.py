import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.crud import payment_info, workflow_task
from app.core.config import settings

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


def get_db_session():
    """Get database session for scheduler tasks."""
    return SessionLocal()


async def check_payment_expiration():
    """Check for expiring payment information and send notifications."""
    logger.info("Checking for expiring payment information...")

    db = get_db_session()
    try:
        # Get payments expiring in the next 30 days
        expiring_payments = payment_info.get_expiring_soon(db, days_ahead=30)

        if expiring_payments:
            logger.info(f"Found {len(expiring_payments)} expiring payments")
            # Here you would implement email notification logic
            # For now, just log the information
            for payment in expiring_payments:
                logger.warning(
                    f"Payment for product {payment.product_id} expires soon")
        else:
            logger.info("No expiring payments found")

    except Exception as e:
        logger.error(f"Error checking payment expiration: {e}")
    finally:
        db.close()


async def check_pending_tasks():
    """Check for pending tasks and send reminder notifications."""
    logger.info("Checking for pending tasks...")

    db = get_db_session()
    try:
        pending_tasks = workflow_task.get_pending_tasks(db)

        if pending_tasks:
            logger.info(f"Found {len(pending_tasks)} pending tasks")
            # Here you would implement email notification logic
            # For now, just log the information
            for task in pending_tasks:
                logger.warning(
                    f"Task {task.id} is still pending for user {task.assignee_user_id}")
        else:
            logger.info("No pending tasks found")

    except Exception as e:
        logger.error(f"Error checking pending tasks: {e}")
    finally:
        db.close()


def start_scheduler():
    """Start the scheduler with configured jobs."""
    logger.info("Starting scheduler...")

    # Add payment expiration check job - runs daily at 9 AM
    scheduler.add_job(
        check_payment_expiration,
        CronTrigger(hour=9, minute=0),
        id="payment_expiration_check",
        name="Check Payment Expiration",
        replace_existing=True
    )

    # Add pending task reminder job - runs every Monday at 10 AM
    scheduler.add_job(
        check_pending_tasks,
        CronTrigger(day_of_week=0, hour=10, minute=0),  # Monday = 0
        id="pending_task_reminder",
        name="Pending Task Reminder",
        replace_existing=True
    )

    scheduler.start()
    logger.info("Scheduler started successfully")


def stop_scheduler():
    """Stop the scheduler."""
    logger.info("Stopping scheduler...")
    scheduler.shutdown()
    logger.info("Scheduler stopped")



