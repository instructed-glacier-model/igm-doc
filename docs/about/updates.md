
# Updates

IGM is regularly updated, which may have an impact on users. For convenience, we summarize here the updates hat may lead to update requirements in parameter files and user modules.

| Date            | Change          | Action required for users |
|-----------------|-----------------|-----------------|
| 26/5/25  | The former `utils.py` file has been re-structured folder-wise | Some user modules may need to change some import like `from ..utils import getmag` to `from igm.utils.math.getmag import getmag`  | 
| 22/5/25 | Parameters `RGI_version` and `RGI_product` were removed in `oggm_shop` | remove them, they are deduced from RGI ID |
| 8/4/25 | `oggm_shop` requires coupling with `load_ncdf` or `local` | add them, check transition notes from IGM 2 to 3   |
| 8/4/25  | Integration and Exclusion of Former Modules | remove/rename modules, check transition notes from IGM 2 to 3   |
| 8/4/25  | New structure of working folder | check transition notes from IGM 2 to 3   |
| 8/4/25  | New user/custum module structure | check transition notes from IGM 2 to 3   |
| 8/4/25  | Parameter name changes (structured) |  Upate parameter name, use script named `json_to_yaml.py`, check transition notes from IGM 2 to 3   |
| 8/4/25  | Hydra integration | Change parameter file from json to yaml, check transition notes from IGM 2 to 3   |

 
    