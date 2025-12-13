from typing import List, Dict, Any
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def validate_year(year: int) -> bool:
    current_year = 2025
    if year < 1950 or year > current_year:
        logger.warning(f"Invalid year: {year}. Must be between 1950 and {current_year}")
        return False
    return True

def validate_round(round: int) -> bool:
    if round < 1 or round > 25:
        logger.warning(f"Invalid round: {round}. Must be between 1 and 25")
        return False
    return True

def validate_driver_id(driver_id: str) -> bool:
    if not driver_id or len(driver_id) > 50:
        logger.warning(f"Invalid driver ID: {driver_id}")
        return False
    return True

def format_lap_time(seconds: float) -> str:
    minutes = int(seconds // 60)
    remaining_seconds = seconds % 60
    return f"{minutes}:{remaining_seconds:.3f}"

def calculate_average_lap_time(lap_data: List[Dict[str, Any]]) -> float:
    if not lap_data:
        return 0.0

    total_seconds = 0.0
    for lap in lap_data:
        time_str = lap["time"]
        try:
            parts = time_str.split(":")
            if len(parts) == 2:
                minutes, seconds = parts
                total_seconds += float(minutes) * 60 + float(seconds)
        except (ValueError, IndexError) as e:
            logger.error(f"Error parsing lap time {time_str}: {str(e)}")
            continue

    return total_seconds / len(lap_data) if len(lap_data) > 0 else 0.0