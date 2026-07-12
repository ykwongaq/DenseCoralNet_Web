from typing import Any, Dict, List, Optional

from .data import Data


class Dataset:
    def __init__(self):
        self.data_list: Dict[int, Data] = {}
        self.class_palette: Dict[int, Dict[str, Any]] = {}
        self._next_id: int = 0

    def add_data(self, data: Data):
        """Add a Data item, auto-assigning its ID."""
        data.set_id(self._next_id)
        self.data_list[self._next_id] = data
        self._next_id += 1

    def find_next_id(self) -> int:
        return self._next_id

    def get_data(self, index: int) -> Optional[Data]:
        return self.data_list.get(index)

    def get_all_data(self) -> List[Data]:
        """Return all data items sorted by ID."""
        return [self.data_list[k] for k in sorted(self.data_list.keys())]

    def get_all_class_ids(self) -> List[int]:
        """Collect all unique class IDs across all data items."""
        all_ids = set()
        for data in self.data_list.values():
            all_ids.update(data.class_ids)
        return sorted(all_ids)

    def get_palette_list(self) -> List[Dict[str, Any]]:
        """Return the class palette as a list sorted by class ID."""
        return [self.class_palette[cid] for cid in sorted(self.class_palette.keys())]

    def __len__(self) -> int:
        return len(self.data_list)
