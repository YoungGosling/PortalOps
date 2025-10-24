"""Debug endpoint for scheduler status."""
from fastapi import APIRouter, Depends
from app.core.deps import get_current_user
from app.core.config import settings
from app.core.scheduler import scheduler
from typing import Dict, Any

router = APIRouter()


@router.get("/scheduler/status")
async def get_scheduler_status(
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get scheduler status and configuration."""
    
    jobs = []
    for job in scheduler.get_jobs():
        jobs.append({
            "id": job.id,
            "name": job.name,
            "next_run_time": str(job.next_run_time) if job.next_run_time else None,
            "trigger": str(job.trigger)
        })
    
    return {
        "scheduler_running": scheduler.running,
        "scheduler_state": scheduler.state,
        "jobs": jobs,
        "config": {
            "PAYMENT_EXPIRATION_CHECK_HOUR": settings.PAYMENT_EXPIRATION_CHECK_HOUR,
            "PAYMENT_EXPIRATION_CHECK_MINUTE": settings.PAYMENT_EXPIRATION_CHECK_MINUTE,
            "TASK_REMINDER_DAY_OF_WEEK": settings.TASK_REMINDER_DAY_OF_WEEK,
            "TASK_REMINDER_HOUR": settings.TASK_REMINDER_HOUR,
            "TASK_REMINDER_MINUTE": settings.TASK_REMINDER_MINUTE,
        }
    }


@router.post("/scheduler/trigger-payment-check")
async def trigger_payment_check(
    current_user = Depends(get_current_user)
) -> Dict[str, str]:
    """Manually trigger payment expiration check."""
    from app.core.scheduler import check_payment_expiration
    
    try:
        await check_payment_expiration()
        return {"status": "success", "message": "Payment check completed"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

