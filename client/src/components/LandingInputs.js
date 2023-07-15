import React, { useState } from 'react'

import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

export default function LandingInputs({name, password = false, value, setValue}) {
    const [pwVisible, setPwVisible] = useState(false);

    return (
    <div className="flex flex-col">
        <p className="text-neutral-700">{name}</p>
        <div className="flex flex-row border border-neutral-500 px-1 mt-1 rounded">
            <input type={(password && !pwVisible) ? "password" : "text"} className="flex-1 p-2 outline-none" value={value} onChange={(e) => setValue(e.target.value)}/>
            {(() => {
                if (password) {
                    return <div className='p-1 cursor-pointer hover:opacity-80 flex justify-center items-center' onClick={() => setPwVisible(!pwVisible)}>
                        {pwVisible ? <VisibilityIcon/> : <VisibilityOffIcon/>}
                    </div>
                }
            })()}
        </div>
    </div>
  )
}
