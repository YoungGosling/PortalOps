import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from app.db.database import SessionLocal
from app.crud import workflow_task
from datetime import datetime
import pytz

logger = logging.getLogger(__name__)

# Use system local timezone for scheduler
# This ensures scheduled times match the system clock
scheduler = AsyncIOScheduler(timezone=pytz.timezone('Asia/Shanghai'))


def get_db_session():
    """Get database session for scheduler tasks."""
    return SessionLocal()


async def check_payment_expiration():
    """
    Check for expired payments and auto-generate renewal payment records.

    Logic:
    1. For each product, check if its status is 'Inactive'. If yes, skip the product.
    2. For each product, check if it has any 'incomplete' bills. If yes, skip the product.
    3. For products without incomplete bills, find the bill with the latest payment_date.
    4. If the latest bill's status is 'complete' and usage_end_date < today, create a new incomplete bill.
    5. New bill inherits product_id and service (via product relationship) from the latest bill.
    6. New bill has status='incomplete', reporter='System', and all other fields set to None.
    """
    logger.info("=" * 60)
    logger.info("🔔 SCHEDULER TRIGGERED: Payment Expiration Check")
    logger.info(f"Execution time: {datetime.now()}")
    logger.info("Checking for expired payment records...")

    from datetime import date
    from app.models.payment import PaymentInfo, ProductStatus
    from app.models.service import Product
    from sqlalchemy import and_

    db = get_db_session()
    try:
        today = date.today()
        logger.info(f"Today's date: {today}")

        # Get all products with at least one payment record
        products_with_payments = db.query(Product).join(
            PaymentInfo,
            Product.id == PaymentInfo.product_id
        ).distinct().all()

        logger.info(
            f"Found {len(products_with_payments)} products with payment records")

        processed_count = 0
        skipped_inactive_count = 0
        skipped_incomplete_count = 0
        created_count = 0

        # Get the Overdue status ID
        overdue_status = db.query(ProductStatus).filter(
            ProductStatus.name == 'Overdue'
        ).first()

        if not overdue_status:
            logger.error("Overdue status not found in database")
            return

        for product in products_with_payments:
            # Step 1: Check if the product status is Inactive
            if product.status and product.status.name == 'Inactive':
                logger.info(
                    f"Product {product.name} (ID: {product.id}) has Inactive status - skipping")
                skipped_inactive_count += 1
                continue

            # Step 2: Check if the product has any incomplete bills
            incomplete_bills = db.query(PaymentInfo).filter(
                and_(
                    PaymentInfo.product_id == product.id,
                    PaymentInfo.status == 'incomplete'
                )
            ).first()

            if incomplete_bills:
                logger.info(
                    f"Product {product.name} (ID: {product.id}) has incomplete bills - skipping")
                skipped_incomplete_count += 1
                continue

            # Step 2: Find the bill with the latest payment_date for this product
            latest_bill = db.query(PaymentInfo).filter(
                PaymentInfo.product_id == product.id
            ).order_by(PaymentInfo.payment_date.desc()).first()

            if not latest_bill:
                logger.warning(
                    f"Product {product.name} (ID: {product.id}) has no bills - skipping")
                continue

            processed_count += 1

            # Step 3: Check if the latest bill is complete and expired
            if str(latest_bill.status) != 'complete':
                logger.info(
                    f"Product {product.name} (ID: {product.id}) - latest bill is not complete (status: {latest_bill.status}) - skipping"
                )
                continue

            # Compare dates (type: ignore because SQLAlchemy ORM instances have Python values)
            if not (latest_bill.usage_end_date < today):  # type: ignore
                logger.info(
                    f"Product {product.name} (ID: {product.id}) - latest bill not expired yet "
                    f"(end date: {latest_bill.usage_end_date}, today: {today}) - skipping"
                )
                continue

            # Step 4: Create new incomplete payment record
            logger.info(
                f"Product {product.name} (ID: {product.id}) - latest bill expired "
                f"(end date: {latest_bill.usage_end_date} < today: {today}) - creating new bill"
            )

            new_payment = PaymentInfo(
                product_id=product.id,
                status='incomplete',
                amount=None,
                cardholder_name=None,
                expiry_date=None,
                payment_method_id=None,
                payment_date=None,
                usage_start_date=None,
                usage_end_date=None,
                reporter='System'
            )
            db.add(new_payment)
            created_count += 1

            # Update product status to Overdue
            # Type ignore: SQLAlchemy ORM instances have Python values, not Column objects
            if product.status_id != overdue_status.id:  # type: ignore
                old_status = product.status_id
                product.status_id = overdue_status.id  # type: ignore
                logger.info(
                    f"Updated product {product.name} (ID: {product.id}) status from {old_status} to Overdue")

            logger.info(
                f"Created renewal payment for product {product.name} (ID: {product.id})"
            )

        db.commit()
        logger.info(
            f"Payment expiration check summary: "
            f"Total products processed: {processed_count}, "
            f"Products skipped (Inactive status): {skipped_inactive_count}, "
            f"Products skipped (with incomplete bills): {skipped_incomplete_count}, "
            f"New bills created: {created_count}"
        )

    except Exception as e:
        logger.error(f"Error checking payment expiration: {e}", exc_info=True)
        db.rollback()
    finally:
        db.close()
        logger.info("Payment expiration check completed")
        logger.info("=" * 60)


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
    from app.core.config import settings

    logger.info("=" * 60)
    logger.info("Starting scheduler...")
    logger.info(f"Current time: {datetime.now()}")
    logger.info(f"Current timezone: {scheduler.timezone}")
    logger.info(f"Current scheduler state: {scheduler.state}")

    # Get configurable schedule times from settings
    payment_check_hour = settings.PAYMENT_EXPIRATION_CHECK_HOUR
    payment_check_minute = settings.PAYMENT_EXPIRATION_CHECK_MINUTE
    task_reminder_hour = settings.TASK_REMINDER_HOUR
    task_reminder_minute = settings.TASK_REMINDER_MINUTE
    task_reminder_day = settings.TASK_REMINDER_DAY_OF_WEEK

    logger.info(f"Loaded config from settings:")
    logger.info(f"  - PAYMENT_EXPIRATION_CHECK_HOUR: {payment_check_hour}")
    logger.info(f"  - PAYMENT_EXPIRATION_CHECK_MINUTE: {payment_check_minute}")
    logger.info(f"  - TASK_REMINDER_DAY_OF_WEEK: {task_reminder_day}")
    logger.info(f"  - TASK_REMINDER_HOUR: {task_reminder_hour}")
    logger.info(f"  - TASK_REMINDER_MINUTE: {task_reminder_minute}")

    # Add payment expiration check job - runs daily at configured time (default: 00:01)
    # misfire_grace_time: Allow job to run even if it's late by up to 300 seconds (5 minutes)
    scheduler.add_job(
        check_payment_expiration,
        CronTrigger(hour=payment_check_hour, minute=payment_check_minute),
        id="payment_expiration_check",
        name="Check Payment Expiration",
        replace_existing=True,
        misfire_grace_time=300  # Allow 5 minutes grace period for missed jobs
    )
    logger.info(
        f"Payment expiration check scheduled at {payment_check_hour:02d}:{payment_check_minute:02d} daily")

    # Add pending task reminder job - runs weekly at configured time (default: Monday 10:00)
    scheduler.add_job(
        check_pending_tasks,
        CronTrigger(day_of_week=task_reminder_day,
                    hour=task_reminder_hour, minute=task_reminder_minute),
        id="pending_task_reminder",
        name="Pending Task Reminder",
        replace_existing=True
    )
    logger.info(
        f"Pending task reminder scheduled at day {task_reminder_day}, {task_reminder_hour:02d}:{task_reminder_minute:02d}")

    # Start the scheduler
    scheduler.start()
    logger.info("Scheduler started successfully")
    logger.info(f"Scheduler running: {scheduler.running}")

    # Now we can get next run times after scheduler has started
    try:
        payment_job = scheduler.get_job("payment_expiration_check")
        task_job = scheduler.get_job("pending_task_reminder")

        if payment_job and hasattr(payment_job, 'next_run_time'):
            logger.info(f"Payment check next run: {payment_job.next_run_time}")

        if task_job and hasattr(task_job, 'next_run_time'):
            logger.info(f"Task reminder next run: {task_job.next_run_time}")

        logger.info(f"Total jobs scheduled: {len(scheduler.get_jobs())}")
    except Exception as e:
        logger.warning(f"Could not retrieve next run times: {e}")

    logger.info("=" * 60)


def stop_scheduler():
    """Stop the scheduler."""
    logger.info("Stopping scheduler...")
    scheduler.shutdown()
    logger.info("Scheduler stopped")
